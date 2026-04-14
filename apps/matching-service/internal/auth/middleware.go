package auth

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/kovari/matching-service/internal/repository"
	"github.com/patrickmn/go-cache"
	"golang.org/x/time/rate"
)

type contextKey string

const (
	ContextUserID    contextKey = "userId"
	ContextRequestID contextKey = "requestId"
	ContextStartTime contextKey = "startTime"
)

type ErrorResponse struct {
	Error struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
}

var (
	userLimiters = cache.New(5*time.Minute, 10*time.Minute)
	globalLimiter *rate.Limiter
)

func InitRateLimiter() error {
	limitStr := os.Getenv("GLOBAL_RATE_LIMIT")
	if limitStr == "" {
		return fmt.Errorf("CRITICAL: GLOBAL_RATE_LIMIT environment variable is required")
	}
	limit, err := strconv.ParseFloat(limitStr, 64)
	if err != nil {
		return fmt.Errorf("CRITICAL: Invalid GLOBAL_RATE_LIMIT: %v", err)
	}
	globalLimiter = rate.NewLimiter(rate.Limit(limit), int(limit))
	return nil
}

func SendError(w http.ResponseWriter, status int, code, message string, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	
	resp := ErrorResponse{}
	resp.Error.Code = code
	resp.Error.Message = message
	
	json.NewEncoder(w).Encode(resp)

	reqID := r.Header.Get("X-Request-Id")
	userID := r.Header.Get("X-User-Id")
	start, _ := r.Context().Value(ContextStartTime).(time.Time)
	latency := time.Since(start)

	log.Printf("[%s] ERROR: %s | Status: %d | User: %s | Latency: %v | Reason: %s",
		reqID, code, status, userID, latency, message)
}

func SecurityMiddleware(repo *repository.RedisRepository, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()
		ctx := context.WithValue(r.Context(), ContextStartTime, startTime)

		// 1. Header Integrity (Strict single-value check)
		headers := []string{"X-User-Id", "X-Timestamp", "X-Internal-Signature", "X-Request-Id"}
		for _, h := range headers {
			vals := r.Header[h]
			if len(vals) != 1 {
				SendError(w, http.StatusUnauthorized, "UNAUTHORIZED", fmt.Sprintf("Missing or duplicate header: %s", h), r)
				return
			}
		}

		userID := r.Header.Get("X-User-Id")
		timestampStr := r.Header.Get("X-Timestamp")
		signature := r.Header.Get("X-Internal-Signature")
		requestId := r.Header.Get("X-Request-Id")

		ctx = context.WithValue(ctx, ContextUserID, userID)
		ctx = context.WithValue(ctx, ContextRequestID, requestId)
		r = r.WithContext(ctx)

		// 2. RequestId Hardening
		if len(requestId) > 64 {
			SendError(w, http.StatusBadRequest, "INVALID_INPUT", "RequestId too long", r)
			return
		}
		if _, err := uuid.Parse(requestId); err != nil {
			SendError(w, http.StatusBadRequest, "INVALID_INPUT", "RequestId must be a valid UUID v4", r)
			return
		}

		// 3. Timestamp Consistency
		timestamp, err := strconv.ParseInt(timestampStr, 10, 64)
		if err != nil || timestamp <= 0 {
			SendError(w, http.StatusBadRequest, "INVALID_INPUT", "Invalid timestamp format", r)
			return
		}

		now := time.Now().Unix()
		if timestamp < now-60 || timestamp > now+60 {
			SendError(w, http.StatusUnauthorized, "TIMESTAMP_EXPIRED", "Request timestamp outside of ±60s window", r)
			return
		}

		// 4. HMAC Integrity
		secretCurrent := os.Getenv("INTERNAL_API_SECRET_CURRENT")
		secretPrevious := os.Getenv("INTERNAL_API_SECRET_PREVIOUS")
		if secretCurrent == "" {
			log.Printf("CRITICAL: INTERNAL_API_SECRET_CURRENT is NOT set")
			SendError(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "Security misconfiguration", r)
			return
		}

		payload := fmt.Sprintf("%s|%s|%s", userID, timestampStr, requestId)
		
		isValid := false
		// Try current secret
		if verifyHMAC(payload, signature, secretCurrent) {
			isValid = true
		} else if secretPrevious != "" && verifyHMAC(payload, signature, secretPrevious) {
			isValid = true
			log.Printf("[%s] WARN: Validated using PREVIOUS secret for User: %s", requestId, userID)
		}

		if !isValid {
			SendError(w, http.StatusUnauthorized, "INVALID_SIGNATURE", "HMAC signature verification failed", r)
			return
		}

		// 5. Atomic Replay Protection
		replayKey := fmt.Sprintf("k:auth:r:%s", requestId)
		set, err := repo.SetNX(ctx, replayKey, "1", 60*time.Second)
		if err != nil {
			// FAIL CLOSED
			log.Printf("[%s] REDIS ERROR during replay check: %v", requestId, err)
			SendError(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Security validation layer error", r)
			return
		}
		if !set {
			SendError(w, http.StatusForbidden, "REPLAY_ATTACK", "Duplicate requestId detected within window", r)
			return
		}

		// 6. Rate Limiting
		if !globalLimiter.Allow() {
			SendError(w, http.StatusTooManyRequests, "RATE_LIMITED", "Global rate limit exceeded", r)
			return
		}

		limiter, found := userLimiters.Get(userID)
		if !found {
			// Per-user: 5 req/sec burst, 1 req/sec sustained
			limiter = rate.NewLimiter(rate.Limit(1.0), 5)
			userLimiters.Set(userID, limiter, cache.DefaultExpiration)
		}
		if !limiter.(*rate.Limiter).Allow() {
			SendError(w, http.StatusTooManyRequests, "RATE_LIMITED", "User-specific rate limit exceeded", r)
			return
		}

		// Success - Proceed
		next(w, r)
	}
}

func verifyHMAC(payload, signature, secret string) bool {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(payload))
	expected := hex.EncodeToString(h.Sum(nil))
	
	// Constant-time comparison
	return hmac.Equal([]byte(signature), []byte(expected))
}
