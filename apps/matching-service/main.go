package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"time"

	"golang.org/x/sync/errgroup"

	"github.com/joho/godotenv"

	"github.com/kovari/matching-service/internal/ai"
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
	
	// Load root first if exists
	if _, err := os.Stat(rootEnv); err == nil {
		godotenv.Load(rootEnv)
		log.Printf("Loaded environment from %s", rootEnv)
	}
	
	// Ensure we search web folder as well
	if _, err := os.Stat(webEnv); err == nil {
		godotenv.Load(webEnv)
		log.Printf("Searching environment in %s", webEnv)
	}

	redisURL := os.Getenv("REDIS_URL")
	sbURL := os.Getenv("NEXT_PUBLIC_SUPABASE_URL")
	sbKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	geoKey := os.Getenv("GEOAPIFY_API_KEY")
	mlServerURL := os.Getenv("ML_SERVER_URL")

	if redisURL == "" || sbURL == "" || sbKey == "" || mlServerURL == "" {
		log.Fatalf("CRITICAL ERROR: Missing required environment variables (REDIS_URL, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ML_SERVER_URL).")
	}

	configPath := "../../packages/config/matching.json"
	matchConfig, configHash, err := config.LoadMatchingConfig(configPath)
	if err != nil {
		log.Printf("Warning: Could not load matching config from %s: %v. Using defaults.", configPath, err)
		matchConfig = &models.MatchingConfig{
			Version:       "v1",
			ConfigVersion: "DEFAULT",
			SoloWeights: map[string]float64{
				"destination": 0.25, "dates": 0.20, "budget": 0.20, "interests": 0.10,
				"personality": 0.10, "age": 0.05, "lifestyle": 0.05, "location": 0.05,
			},
			MLBlend: map[string]float64{"solo": 0.6, "group": 0.3},
		}
		configHash = "DEFAULT"
	}

	log.Printf("Loaded Config: %+v", matchConfig)
	log.Printf("Config Hash: %s", configHash)

	mlClient = ai.NewMLClient()

	repo, err := repository.NewRedisRepository(redisURL)
	if err != nil {
		log.Fatal(err)
	}

	sbRepo, err = repository.NewSupabaseRepository(sbURL, sbKey, geoKey, repo)
	if err != nil {
		log.Fatalf("CRITICAL ERROR: Failed to connected to Supabase: %v", err)
	}
	log.Printf("SUCCESS: Connected to Supabase (%s) successfully (Geoapify: %v, Cache: ENABLED).", sbURL, geoKey != "")

	// Startup Ping Check
	ctx := context.Background()
	if err := repo.Ping(ctx); err != nil {
		log.Printf("WARNING: Redis connectivity check failed: %v. The service may fail during requests.", err)
	} else {
		log.Printf("SUCCESS: Connected to Redis successfully.")
	}

	http.HandleFunc("/v1/match/solo", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			UserId string `json:"userId"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		ctx := r.Context()
		startTime := time.Now()

		// STEP 1: Parallel Fetch sessions from Redis
		var userSession *models.SoloSession
		var candidates []models.SoloSession
		// Relaxed timeout for reliability
		redisCtx, redisCancel := context.WithTimeout(ctx, 60*time.Second)
		defer redisCancel()
		g, gCtx := errgroup.WithContext(redisCtx)



		g.Go(func() error {
			var err error
			userSession, err = repo.GetSession(gCtx, req.UserId)
			return err
		})

		g.Go(func() error {
			var err error
			candidates, err = repo.FetchAllSessions(gCtx, req.UserId)
			return err
		})

		if err := g.Wait(); err != nil {
			log.Printf("Error: Redis fetch failed: %v", err)
			http.Error(w, fmt.Sprintf("Redis Error: %v", err), 500)
			return
		}


		if userSession == nil {
			log.Printf("Error: Session for %s not found in Redis", req.UserId)
			http.Error(w, "Requester session not found", 404)
			return
		}

		// STEP 2: Hydrate ALL profiles in a single batch call (Deduplicated)
		allUserIds := []string{req.UserId}
		candidateMap := make(map[string]models.SoloSession)
		
		// Deduplicate and filter out requester from candidates
		seenIds := make(map[string]bool)
		seenIds[req.UserId] = true
		
		// Phase 1.5 Early Exclusion: Add all known IDs of requester to skip-list
		if userSession.ClerkUserId != "" { seenIds[userSession.ClerkUserId] = true }
		if userSession.UserId != "" { seenIds[userSession.UserId] = true }
		if userSession.StaticAttributes != nil && userSession.StaticAttributes.UserID != "" {
			seenIds[userSession.StaticAttributes.UserID] = true
		}
		
		for _, c := range candidates {
			if c.UserId != "" && !seenIds[c.UserId] {
				allUserIds = append(allUserIds, c.UserId)
				candidateMap[c.UserId] = c
				seenIds[c.UserId] = true
			}
		}

		// Collect pre-resolved coordinates from Redis sessions (Architecture Fix)
		preResolved := make(map[string]models.Coordinates)
		if userSession.Location.Lat != 0 || userSession.Location.Lon != 0 {
			preResolved[userSession.UserId] = userSession.Location
		}
		for _, c := range candidates {
			if c.Location.Lat != 0 || c.Location.Lon != 0 {
				preResolved[c.UserId] = c.Location
			}
		}

		profiles, err := sbRepo.FetchProfilesBatch(ctx, allUserIds, preResolved)
		if err != nil {
			log.Printf("Error: Profile hydration failed: %v", err)
			http.Error(w, "Profile service error", 500)
			return
		}


		// Apply profiles to sessions
		if p, ok := profiles[req.UserId]; ok {
			userSession.StaticAttributes = p
		}
		
		var validCandidates []models.SoloSession
		requesterInternalId := ""
		if userSession.StaticAttributes != nil {
			requesterInternalId = userSession.StaticAttributes.UserID
		}

		for id, session := range candidateMap {
			if p, ok := profiles[id]; ok {
				// 🚫 MULTI-LAYER SELF-EXCLUSION: ensure requester is NEVER a match
				isSelf := false
				if requesterInternalId != "" && p.UserID == requesterInternalId {
					isSelf = true
				} else if userSession.ClerkUserId != "" && p.ClerkUserId == userSession.ClerkUserId {
					isSelf = true
				} else if id == req.UserId {
					isSelf = true
				}

				if isSelf {
					log.Printf("Matching: Explicitly excluded requester %s (Internal: %s) from candidates", id, p.UserID)
					continue
				}

				session.StaticAttributes = p
				// NEW: Preserve coordinates from profile if session was missing them
				if session.Location.Lat == 0 && session.Location.Lon == 0 && (p.Location.Lat != 0 || p.Location.Lon != 0) {
					session.Location = p.Location
					session.GeoSource = "healed"
				}
				validCandidates = append(validCandidates, session)
			}
		}

		// NEW: Self-Healing Redis Loop (Async)
		go func(reqId string, sess *models.SoloSession, candidates []models.SoloSession) {
			// Small buffer to prevent write storms
			time.Sleep(50 * time.Millisecond)
			
			bgCtx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
			defer cancel()

			// Check requester
			if sess.Location.Lat != 0 || sess.Location.Lon != 0 {
				// Only update if it was actually changed or missing in original session
				// For simplicity, we just check if it was missing before profiles lookup
				// In FetchProfilesBatch, we set it. So we check if sess.GeoSource is "healed" or "resolved"
				// but userSession was loaded from Redis at the start.
				
				// Re-verify if it needs update (already done in main flow by checking Lat != 0)
				// We'll just re-save sessions that have coordinates now but might not have had them in Redis
				// Read-Update-Write pattern (simplified since we have the latest session)
				data, _ := json.Marshal(sess)
				// Use 7 days TTL (parity with Web API default)
				repo.SetCache(bgCtx, fmt.Sprintf("session:%s", reqId), string(data), 168*time.Hour)
			}
			
			// Optional: Heal candidates too? Only if they were "healed" during this request
			// To keep it simple and safe (avoid write storms), let's just heal the requester for now.
			// Requesters are the ones actively waiting and will benefit most.
		}(req.UserId, userSession, validCandidates)


		if userSession.StaticAttributes == nil {
			log.Printf("🔥 CRITICAL ERROR: Requester %s has no profile in Supabase!", req.UserId)
			http.Error(w, "Requester profile missing", 400)
			return
		}

		// STEP 3: Parallel Logic (ML vs Rule-Based Feature Extraction)
		featuresList := make([]models.MLFeatures, 0, len(validCandidates))
		for _, match := range validCandidates {
			featuresList = append(featuresList, ai.ExtractSoloFeatures(*userSession, match))
		}

		var mlResults []models.MLPredictionResult
		var mlErr error
		mlUsed := false
		mlStartTime := time.Now()
		
		// Strict ML Timeout (150ms)
		mlCtx, mlCancel := context.WithTimeout(ctx, 150*time.Millisecond)
		defer mlCancel()

		mlGroup, _ := errgroup.WithContext(mlCtx)
		mlGroup.Go(func() error {
			if len(featuresList) > 0 {
				mlResults, mlErr = mlClient.ScoreBatch(mlCtx, featuresList)
				if mlErr == nil {
					mlUsed = true
				} else {
					log.Printf("ML Warning: ML fallback active: %v", mlErr)
				}
			}
			return nil
		})
		
		mlGroup.Wait()
		mlLatency := time.Since(mlStartTime)

		// STEP 4: Final Scoring & Blending
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
					Gender:      match.StaticAttributes.Gender,
					Personality: match.StaticAttributes.Personality,
					Bio:         match.StaticAttributes.Bio,
					Avatar:      match.StaticAttributes.Avatar,
					Budget:      match.Budget,
					Location:    match.StaticAttributes.RawLocation,
					LocationDisplay: match.StaticAttributes.RawLocation,
					Smoking:     match.StaticAttributes.Smoking,
					Drinking:    match.StaticAttributes.Drinking,
					Interests:   match.StaticAttributes.Interests,
					Languages:   match.StaticAttributes.Languages,
					Nationality: match.StaticAttributes.Nationality,
					Religion:    match.StaticAttributes.Religion,
					Profession:  match.StaticAttributes.Profession,
					FoodPreference: match.StaticAttributes.FoodPreference,
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
		log.Printf("[MatchRequest] Requester:%s | Mode:%s | Candidates:%d | ML_USED:%v | ML_LATENCY:%v | Latency:%v", 
			req.UserId, matchConfig.Mode, len(finalMatches), mlUsed, mlLatency, latency)

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(finalMatches)
	})

	http.HandleFunc("/v1/match/group", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			User          models.SoloSession    `json:"user"`
			Candidates    []models.GroupProfile `json:"candidates"`
			ConfigVersion string                `json:"configVersion"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request body", http.StatusBadRequest)
			return
		}

		if req.ConfigVersion != "" && req.ConfigVersion != matchConfig.ConfigVersion {
			log.Printf("Warning: Config version mismatch. Request: %s, Server: %s", req.ConfigVersion, matchConfig.ConfigVersion)
		}

		// Phase 1: Features for batch ML
		featuresList := make([]models.MLFeatures, 0, len(req.Candidates))
		for _, group := range req.Candidates {
			featuresList = append(featuresList, ai.ExtractGroupFeatures(req.User, group))
		}

		// Phase 2: Batch ML Scoring
		mlResults, mlErr := mlClient.ScoreBatch(r.Context(), featuresList)
		if mlErr != nil {
			log.Printf("Warning: ML scoring failed for group, falling back to rule-based: %v", mlErr)
		}

		// Phase 3: Blending & Final results
		results := make([]models.GroupMatchResult, 0, len(req.Candidates))
		for i, group := range req.Candidates {
			var mlScore *float64
			if mlResults != nil && i < len(mlResults) && mlResults[i].Success {
				s := mlResults[i].Score
				mlScore = &s
			}
			score := matching.CalculateFinalGroupScore(req.User, group, mlScore, matchConfig)
			results = append(results, score)
		}

		sort.Slice(results, func(i, j int) bool {
			return results[i].Score > results[j].Score
		})

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(results)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Matching service starting on port %s...", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
