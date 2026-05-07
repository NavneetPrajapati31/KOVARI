package auth

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/kovari/matching-service/internal/logger"
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
	Success bool `json:"success"`
	Error   struct {
		Code    string `json:"code"`
		Message string `json:"message"`
	} `json:"error"`
	Meta map[string]interface{} `json:"meta"`
}

var (
	userLimiters  = cache.New(5*time.Minute, 10*time.Minute)
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
	reqID := r.Header.Get("X-Request-Id")
	userID := r.Header.Get("X-User-Id")
	start, _ := r.Context().Value(ContextStartTime).(time.Time)
	latency := time.Since(start)

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Request-Id", reqID)
	w.Header().Set("X-Response-Time", fmt.Sprintf("%dms", latency.Milliseconds()))
	w.WriteHeader(status)

	resp := ErrorResponse{
		Success: false,
		Meta: map[string]interface{}{
			"requestId": reqID,
		},
	}
	resp.Error.Code = code
	resp.Error.Message = message

	json.NewEncoder(w).Encode(resp)

	logger.Error(reqID, userID, code, status, latency, fmt.Errorf(message), nil)
}

func SecurityMiddleware(repo *repository.RedisRepository, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()
		logger.IncRequest()

		// 1. Core Header Integrity
		headers := []string{"X-User-Id", "X-Timestamp", "X-Internal-Signature", "X-Request-Id"}
		for _, h := range headers {
			if len(r.Header[h]) != 1 {
				// We don't have requestId yet safely, so we use what we can
				SendError(w, http.StatusUnauthorized, "UNAUTHORIZED", fmt.Sprintf("Missing or duplicate header: %s", h), r)
				return
			}
		}

		userID := r.Header.Get("X-User-Id")
		timestampStr := r.Header.Get("X-Timestamp")
		signature := r.Header.Get("X-Internal-Signature")
		requestId := r.Header.Get("X-Request-Id")

		ctx := context.WithValue(r.Context(), ContextStartTime, startTime)
		ctx = context.WithValue(ctx, ContextUserID, userID)
		ctx = context.WithValue(ctx, ContextRequestID, requestId)
		r = r.WithContext(ctx)

		// 2. RequestId Hardening (Strict UUID v4)
		if len(requestId) > 64 {
			SendError(w, http.StatusBadRequest, "INVALID_INPUT", "RequestId too long", r)
			return
		}
		if _, err := uuid.Parse(requestId); err != nil {
			SendError(w, http.StatusBadRequest, "INVALID_INPUT", "RequestId must be a valid UUID v4", r)
			return
		}

		// 3. Timestamp Consistency (60s skew check)
		timestamp, err := strconv.ParseInt(timestampStr, 10, 64)
		now := time.Now().Unix()
		if err != nil || timestamp <= 0 || timestamp < now-60 || timestamp > now+60 {
			SendError(w, http.StatusUnauthorized, "TIMESTAMP_EXPIRED", "Request timestamp outside of ±60s window or invalid", r)
			return
		}

		// 4. HMAC Integrity (Current + Previous secret support)
		secretCurrent := os.Getenv("INTERNAL_API_SECRET_CURRENT")
		secretPrevious := os.Getenv("INTERNAL_API_SECRET_PREVIOUS")
		if secretCurrent == "" {
			logger.Error(requestId, userID, "SECURITY_MISCONFIG", 500, 0, fmt.Errorf("INTERNAL_API_SECRET_CURRENT is missing"), nil)
			SendError(w, http.StatusInternalServerError, "INTERNAL_SERVER_ERROR", "Security misconfiguration", r)
			return
		}

		payload := fmt.Sprintf("%s|%s|%s", userID, timestampStr, requestId)
		isValid := false
		if verifyHMAC(payload, signature, secretCurrent) {
			isValid = true
		} else if secretPrevious != "" && verifyHMAC(payload, signature, secretPrevious) {
			isValid = true
			logger.Info(requestId, userID, "Used previous secret for validation", 200, 0, nil)
		}

		if !isValid {
			SendError(w, http.StatusUnauthorized, "INVALID_SIGNATURE", "HMAC signature verification failed", r)
			return
		}

		// 5. Atomic Replay Protection (Strict FAIL-CLOSED)
		replayKey := fmt.Sprintf("k:auth:r:%s", requestId)
		set, err := repo.SetNX(ctx, replayKey, "1", 60*time.Second)
		if err != nil {
			logger.Error(requestId, userID, "REDIS_REPLAY_ERROR", 503, 0, err, nil)
			SendError(w, http.StatusServiceUnavailable, "SERVICE_UNAVAILABLE", "Security validation layer error", r)
			return
		}
		if !set {
			SendError(w, http.StatusForbidden, "REPLAY_ATTACK", "Duplicate requestId detected within window", r)
			return
		}

		// 6. Rate Limiting (Global + Per-User)
		if !globalLimiter.Allow() {
			SendError(w, http.StatusTooManyRequests, "RATE_LIMITED", "Global rate limit exceeded", r)
			return
		}

		limiter, found := userLimiters.Get(userID)
		if !found {
			limiter = rate.NewLimiter(rate.Limit(1.0), 5) // 1 req/sec sustained, 5 burst
			userLimiters.Set(userID, limiter, cache.DefaultExpiration)
		}
		if !limiter.(*rate.Limiter).Allow() {
			SendError(w, http.StatusTooManyRequests, "RATE_LIMITED", "User-specific rate limit exceeded", r)
			return
		}

		// Inject Response Headers for success case too
		w.Header().Set("X-Request-Id", requestId)
		
		// Success - Proceed to handler
		next(w, r)
	}
}

func verifyHMAC(payload, signature, secret string) bool {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(payload))
	expected := hex.EncodeToString(h.Sum(nil))
	return hmac.Equal([]byte(signature), []byte(expected))
}
