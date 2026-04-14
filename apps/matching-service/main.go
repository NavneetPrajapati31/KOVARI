package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"sort"
	"syscall"
	"time"

	"golang.org/x/sync/errgroup"

	"github.com/joho/godotenv"

	"github.com/kovari/matching-service/internal/ai"
	"github.com/kovari/matching-service/internal/auth"
	"github.com/kovari/matching-service/internal/config"
	"github.com/kovari/matching-service/internal/logger"
	"github.com/kovari/matching-service/internal/matching"
	"github.com/kovari/matching-service/internal/models"
	"github.com/kovari/matching-service/internal/repository"
)

var (
	mlClient *ai.MLClient
	sbRepo   *repository.SupabaseRepository
	repo     *repository.RedisRepository
)

func main() {
	// Root and app-level env loading
	rootEnv, _ := filepath.Abs("../../.env.local")
	webEnv, _ := filepath.Abs("../web/.env.local")
	if _, err := os.Stat(rootEnv); err == nil {
		godotenv.Load(rootEnv)
	}
	if _, err := os.Stat(webEnv); err == nil {
		godotenv.Load(webEnv)
	}

	// 1. FAIL-FAST STARTUP CHECKS
	requiredEnv := []string{
		"REDIS_URL",
		"NEXT_PUBLIC_SUPABASE_URL",
		"SUPABASE_SERVICE_ROLE_KEY",
		"ML_SERVER_URL",
		"INTERNAL_API_SECRET_CURRENT",
		"GLOBAL_RATE_LIMIT",
	}
	for _, env := range requiredEnv {
		if os.Getenv(env) == "" {
			logger.Fatal(fmt.Sprintf("Missing required environment variable: %s", env), os.ErrNotExist)
		}
	}

	if err := auth.InitRateLimiter(); err != nil {
		logger.Fatal("Failed to initialize rate limiter", err)
	}

	redisURL := os.Getenv("REDIS_URL")
	sbURL := os.Getenv("NEXT_PUBLIC_SUPABASE_URL")
	sbKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	geoKey := os.Getenv("GEOAPIFY_API_KEY")

	var err error
	repo, err = repository.NewRedisRepository(redisURL)
	if err != nil {
		logger.Fatal("Failed to connect to Redis", err)
	}

	// Fail-fast on Redis connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	if err := repo.Ping(ctx); err != nil {
		cancel()
		logger.Fatal("Redis ping failed during startup", err)
	}
	cancel()

	sbRepo, err = repository.NewSupabaseRepository(sbURL, sbKey, geoKey, repo)
	if err != nil {
		logger.Fatal("Failed to connect to Supabase", err)
	}

	mlClient = ai.NewMLClient()

	configPath := "../../packages/config/matching.json"
	matchConfig, _, err := config.LoadMatchingConfig(configPath)
	if err != nil {
		matchConfig = &models.MatchingConfig{
			Version:       "v1",
			ConfigVersion: "DEFAULT",
			SoloWeights: map[string]float64{
				"destination": 0.25, "dates": 0.20, "budget": 0.20, "interests": 0.10,
				"personality": 0.10, "age": 0.05, "lifestyle": 0.05, "location": 0.05,
			},
			MLBlend: map[string]float64{"solo": 0.6, "group": 0.3},
		}
	}

	// --- HANDLERS ---

	healthHandler := func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}

	readyHandler := func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()

		if err := repo.Ping(ctx); err != nil {
			w.WriteHeader(http.StatusServiceUnavailable)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"ready": false,
				"error": "Redis unreachable",
			})
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"ready":   true,
			"metrics": logger.GetMetrics(),
		})
	}

	soloHandler := func(w http.ResponseWriter, r *http.Request) {
		requestId := r.Context().Value(auth.ContextRequestID).(string)
		userId := r.Context().Value(auth.ContextUserID).(string)
		startTime := r.Context().Value(auth.ContextStartTime).(time.Time)

		if r.Method != http.MethodPost {
			auth.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is allowed", r)
			return
		}

		r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 1MB limit
		var req struct{}
		dec := json.NewDecoder(r.Body)
		dec.DisallowUnknownFields()
		if err := dec.Decode(&req); err != nil && err != io.EOF {
			auth.SendError(w, http.StatusBadRequest, "INVALID_INPUT", "Malformed request or unknown fields", r)
			return
		}

		ctx := r.Context()
		var userSession *models.SoloSession
		var candidates []models.SoloSession
		redisCtx, redisCancel := context.WithTimeout(ctx, 3*time.Second)
		defer redisCancel()

		g, gCtx := errgroup.WithContext(redisCtx)
		g.Go(func() error {
			var err error
			userSession, err = repo.GetSession(gCtx, userId)
			return err
		})
		g.Go(func() error {
			var err error
			candidates, err = repo.FetchAllSessions(gCtx, userId)
			return err
		})

		if err := g.Wait(); err != nil {
			auth.SendError(w, 503, "STORAGE_ERROR", "Redis connection failed", r)
			return
		}

		if userSession == nil {
			auth.SendError(w, 404, "NOT_FOUND", "User session not found", r)
			return
		}

		allUserIds := []string{userId}
		candidateMap := make(map[string]models.SoloSession)
		seenIds := make(map[string]bool)
		seenIds[userId] = true
		for _, c := range candidates {
			if c.UserId != "" && !seenIds[c.UserId] {
				allUserIds = append(allUserIds, c.UserId)
				candidateMap[c.UserId] = c
				seenIds[c.UserId] = true
			}
		}

		profiles, err := sbRepo.FetchProfilesBatch(ctx, allUserIds, nil)
		if err != nil {
			auth.SendError(w, 500, "DATABASE_ERROR", "Failed to fetch profiles", r)
			return
		}

		if p, ok := profiles[userId]; ok {
			userSession.StaticAttributes = p
		}
		var validCandidates []models.SoloSession
		for id, session := range candidateMap {
			if p, ok := profiles[id]; ok {
				session.StaticAttributes = p
				validCandidates = append(validCandidates, session)
			}
		}

		featuresList := make([]models.MLFeatures, 0, len(validCandidates))
		for _, match := range validCandidates {
			featuresList = append(featuresList, ai.ExtractSoloFeatures(*userSession, match))
		}

		var mlResults []models.MLPredictionResult
		if len(featuresList) > 0 {
			mlCtx, mlCancel := context.WithTimeout(ctx, 500*time.Millisecond)
			mlResults, _ = mlClient.ScoreBatch(mlCtx, featuresList)
			mlCancel()
		}

		type ScoredMatch struct {
			UserId           string             `json:"userId"`
			User             models.UserPreview `json:"user"`
			Score            float64            `json:"score"`
			Breakdown        matching.Breakdown `json:"breakdown"`
			BudgetDifference string             `json:"budgetDifference"`
			StartDate        string             `json:"startDate"`
			EndDate          string             `json:"endDate"`
			Budget           float64            `json:"budget"`
		}

		finalMatches := make([]ScoredMatch, 0, len(validCandidates))
		for i, match := range validCandidates {
			var mlScore *float64
			if mlResults != nil && i < len(mlResults) && mlResults[i].Success {
				s := mlResults[i].Score
				mlScore = &s
			}
			result := matching.CalculateFinalSoloScore(*userSession, match, mlScore, matchConfig)
			finalMatches = append(finalMatches, ScoredMatch{
				UserId: match.UserId,
				User: models.UserPreview{
					UserId:      match.UserId,
					Name:        match.StaticAttributes.Name,
					Age:         match.StaticAttributes.Age,
					Personality: match.StaticAttributes.Personality,
					Bio:         match.StaticAttributes.Bio,
					Avatar:      match.StaticAttributes.Avatar,
					Budget:      match.Budget,
					Interests:   match.StaticAttributes.Interests,
					Languages:   match.StaticAttributes.Languages,
				},
				Score:            result.Score,
				Breakdown:        result.Breakdown,
				BudgetDifference: result.BudgetDifference,
				StartDate:        match.StartDate,
				EndDate:          match.EndDate,
				Budget:           match.Budget,
			})
		}

		sort.Slice(finalMatches, func(i, j int) bool { return finalMatches[i].Score > finalMatches[j].Score })

		latency := time.Since(startTime)
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Response-Time", fmt.Sprintf("%dms", latency.Milliseconds()))
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"data":    map[string]interface{}{"matches": finalMatches},
			"meta":    map[string]interface{}{"source": "go", "requestId": requestId, "latencyMs": latency.Milliseconds()},
		})
		logger.Info(requestId, userId, "Solo matches generated", http.StatusOK, latency, nil)
	}

	groupHandler := func(w http.ResponseWriter, r *http.Request) {
		requestId := r.Context().Value(auth.ContextRequestID).(string)
		userId := r.Context().Value(auth.ContextUserID).(string)
		startTime := r.Context().Value(auth.ContextStartTime).(time.Time)

		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var req struct {
			Candidates []models.GroupProfile `json:"candidates"`
		}
		dec := json.NewDecoder(r.Body)
		dec.DisallowUnknownFields()
		if err := dec.Decode(&req); err != nil {
			auth.SendError(w, http.StatusBadRequest, "INVALID_INPUT", "Malformed request", r)
			return
		}

		if len(req.Candidates) > 50 {
			auth.SendError(w, http.StatusBadRequest, "INVALID_INPUT", "Too many candidates", r)
			return
		}

		ctx := r.Context()
		userSession, err := repo.GetSession(ctx, userId)
		if err != nil || userSession == nil {
			auth.SendError(w, 404, "NOT_FOUND", "User session not found", r)
			return
		}

		featuresList := make([]models.MLFeatures, 0, len(req.Candidates))
		for _, group := range req.Candidates {
			featuresList = append(featuresList, ai.ExtractGroupFeatures(*userSession, group))
		}

		mlCtx, mlCancel := context.WithTimeout(ctx, 500*time.Millisecond)
		mlResults, _ := mlClient.ScoreBatch(mlCtx, featuresList)
		mlCancel()

		results := make([]models.GroupMatchResult, 0, len(req.Candidates))
		for i, group := range req.Candidates {
			var mlScore *float64
			if mlResults != nil && i < len(mlResults) && mlResults[i].Success {
				s := mlResults[i].Score
				mlScore = &s
			}
			score := matching.CalculateFinalGroupScore(*userSession, group, mlScore, matchConfig)
			results = append(results, score)
		}

		sort.Slice(results, func(i, j int) bool { return results[i].Score > results[j].Score })

		latency := time.Since(startTime)
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("X-Response-Time", fmt.Sprintf("%dms", latency.Milliseconds()))
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"data":    map[string]interface{}{"groups": results},
			"meta":    map[string]interface{}{"source": "go", "requestId": requestId, "latencyMs": latency.Milliseconds()},
		})
		logger.Info(requestId, userId, "Group matches generated", http.StatusOK, latency, nil)
	}

	// Route definitions
	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/ready", readyHandler)
	mux.HandleFunc("/v1/match/solo", auth.SecurityMiddleware(repo, soloHandler))
	mux.HandleFunc("/v1/match/group", auth.SecurityMiddleware(repo, groupHandler))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// 2. GRACEFUL SHUTDOWN
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	go func() {
		logger.Info("", "", "Matching service starting on port "+port, 0, 0, nil)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("Server failed to start", err)
		}
	}()

	<-stop
	logger.Info("", "", "Shutting down matching service...", 0, 0, nil)

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	if err := server.Shutdown(shutdownCtx); err != nil {
		logger.Fatal("Graceful shutdown failed", err)
	}
	logger.Info("", "", "Service stopped clean.", 0, 0, nil)
}
