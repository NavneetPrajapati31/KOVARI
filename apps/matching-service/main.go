package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"time"

	"golang.org/x/sync/errgroup"

	"github.com/joho/godotenv"

	"github.com/kovari/matching-service/internal/ai"
	"github.com/kovari/matching-service/internal/auth"
	"github.com/kovari/matching-service/internal/config"
	"github.com/kovari/matching-service/internal/matching"
	"github.com/kovari/matching-service/internal/models"
	"github.com/kovari/matching-service/internal/repository"
)

var (
	mlClient *ai.MLClient
	sbRepo   *repository.SupabaseRepository
)

func main() {
	// Try to load from root .env.local or apps/web/.env.local
	rootEnv, _ := filepath.Abs("../../.env.local")
	webEnv, _ := filepath.Abs("../web/.env.local")
	
	if _, err := os.Stat(rootEnv); err == nil {
		godotenv.Load(rootEnv)
		log.Printf("Loaded environment from %s", rootEnv)
	}
	
	if _, err := os.Stat(webEnv); err == nil {
		godotenv.Load(webEnv)
		log.Printf("Searching environment in %s", webEnv)
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
			log.Fatalf("CRITICAL ERROR: Missing required environment variable: %s", env)
		}
	}

	if err := auth.InitRateLimiter(); err != nil {
		log.Fatal(err)
	}

	redisURL := os.Getenv("REDIS_URL")
	sbURL := os.Getenv("NEXT_PUBLIC_SUPABASE_URL")
	sbKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	geoKey := os.Getenv("GEOAPIFY_API_KEY")

	configPath := "../../packages/config/matching.json"
	matchConfig, _, err := config.LoadMatchingConfig(configPath)
	if err != nil {
		log.Printf("Warning: Using default matching config.")
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

	mlClient = ai.NewMLClient()

	repo, err := repository.NewRedisRepository(redisURL)
	if err != nil {
		log.Fatal(err)
	}

	sbRepo, err = repository.NewSupabaseRepository(sbURL, sbKey, geoKey, repo)
	if err != nil {
		log.Fatalf("CRITICAL ERROR: Failed to connected to Supabase: %v", err)
	}

	// Solo Matching Handler
	soloHandler := func(w http.ResponseWriter, r *http.Request) {
		requestId := r.Context().Value(auth.ContextRequestID).(string)
		userId := r.Context().Value(auth.ContextUserID).(string)

		if r.Method != http.MethodPost {
			auth.SendError(w, http.StatusMethodNotAllowed, "METHOD_NOT_ALLOWED", "Only POST is allowed", r)
			return
		}

		// 2. HARDENED DECODING: Read max 1MB, disallow unknown fields
		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var req struct{} // No body fields expected/trusted
		dec := json.NewDecoder(r.Body)
		dec.DisallowUnknownFields()
		if err := dec.Decode(&req); err != nil && err != io.EOF {
			log.Printf("[%s] Error: Invalid request or unknown fields: %v", requestId, err)
			auth.SendError(w, http.StatusBadRequest, "INVALID_INPUT", "Malformed request or unknown fields", r)
			return
		}

		ctx := r.Context()
		startTime := time.Now()

		var userSession *models.SoloSession
		var candidates []models.SoloSession
		redisCtx, redisCancel := context.WithTimeout(ctx, 3*time.Second) // Strict timeout
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
			log.Printf("[%s] Error: Redis fetch failed: %v", requestId, err)
			auth.SendError(w, 500, "REDIS_ERROR", "Internal storage error", r)
			return
		}

		if userSession == nil {
			auth.SendError(w, 404, "NOT_FOUND", "User session not found", r)
			return
		}

		// Hydration & Scoring Logic
		allUserIds := []string{userId}
		candidateMap := make(map[string]models.SoloSession)
		seenIds := make(map[string]bool)
		seenIds[userId] = true
		
		if userSession.ClerkUserId != "" { seenIds[userSession.ClerkUserId] = true }
		if userSession.UserId != "" { seenIds[userSession.UserId] = true }
		
		for _, c := range candidates {
			if c.UserId != "" && !seenIds[c.UserId] {
				allUserIds = append(allUserIds, c.UserId)
				candidateMap[c.UserId] = c
				seenIds[c.UserId] = true
			}
		}

		preResolved := make(map[string]models.Coordinates)
		if userSession.Location.Lat != 0 || userSession.Location.Lon != 0 {
			preResolved[userSession.UserId] = userSession.Location
		}

		profiles, err := sbRepo.FetchProfilesBatch(ctx, allUserIds, preResolved)
		if err != nil {
			auth.SendError(w, 500, "PROFILE_SERVICE_ERROR", "Failed to fetch user profiles", r)
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
		mlStartTime := time.Now()
		mlCtx, mlCancel := context.WithTimeout(ctx, 200*time.Millisecond)
		defer mlCancel()

		mlGroup, _ := errgroup.WithContext(mlCtx)
		mlGroup.Go(func() error {
			if len(featuresList) > 0 {
				mlResults, _ = mlClient.ScoreBatch(mlCtx, featuresList)
			}
			return nil
		})
		mlGroup.Wait()
		mlLatency := time.Since(mlStartTime)

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

		sort.Slice(finalMatches, func(i, j int) bool {
			return finalMatches[i].Score > finalMatches[j].Score
		})

		latency := time.Since(startTime)
		log.Printf("[%s] SUCCESS: Matches: %d | ML_Lat: %v | Total_Lat: %v", requestId, len(finalMatches), mlLatency, latency)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"matches": finalMatches,
		})
	}

	// Group Matching Handler
	groupHandler := func(w http.ResponseWriter, r *http.Request) {
		requestId := r.Context().Value(auth.ContextRequestID).(string)
		userId := r.Context().Value(auth.ContextUserID).(string)

		r.Body = http.MaxBytesReader(w, r.Body, 1<<20)
		var req struct {
			Candidates []models.GroupProfile `json:"candidates"`
		}
		dec := json.NewDecoder(r.Body)
		dec.DisallowUnknownFields()
		if err := dec.Decode(&req); err != nil {
			auth.SendError(w, http.StatusBadRequest, "INVALID_INPUT", "Malformed request or unknown fields", r)
			return
		}

		// 3. STRICT CONSTRAINTS: Limit array size
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

		mlResults, _ := mlClient.ScoreBatch(ctx, featuresList)

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

		sort.Slice(results, func(i, j int) bool {
			return results[i].Score > results[j].Score
		})

		log.Printf("[%s] SUCCESS: Groups: %d", requestId, len(results))

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"groups":  results,
		})
	}

	// 4. APPLY SECURITY MIDDLEWARE
	http.HandleFunc("/v1/match/solo", auth.SecurityMiddleware(repo, soloHandler))
	http.HandleFunc("/v1/match/group", auth.SecurityMiddleware(repo, groupHandler))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Matching service starting on port %s...", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
