package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/kovari/matching-service/internal/models"
	"github.com/redis/go-redis/v9"
)

type RedisRepository struct {
	client        *redis.Client
	indexInFlight sync.Map
}

func NewRedisRepository(url string) (*RedisRepository, error) {
	opts, err := redis.ParseURL(url)
	if err != nil {
		return nil, err
	}

	// RELAXED TIMEOUTS FOR RELIABILITY
	opts.DialTimeout = 30 * time.Second
	opts.ReadTimeout = 30 * time.Second
	opts.WriteTimeout = 30 * time.Second
	opts.PoolSize = 50
	opts.PoolTimeout = 30 * time.Second
	opts.MinIdleConns = 10
	opts.MaxRetries = 5

	opts.MinIdleConns = 5
	opts.MaxRetries = 2

	client := redis.NewClient(opts)
	return &RedisRepository{client: client}, nil
}

func (r *RedisRepository) Ping(ctx context.Context) error {
	return r.client.Ping(ctx).Err()
}

const MaxCandidates = 500

func (r *RedisRepository) FetchAllSessions(ctx context.Context, excludeUserId string) ([]models.SoloSession, error) {
	var sessions []models.SoloSession
	var keys []string
	var err error

	// Phase 1.5 Optimization: Try sessions:index set first
	keys, err = r.client.SMembers(ctx, "sessions:index").Result()
	
	if err != nil || len(keys) == 0 {
		log.Printf("Repository: Index missing or empty (Total candidates: 0)")
		
		// 1. Shallow SCAN (Fast Fallback - 1 batch only)
		// This provides a few results instantly without waiting for a full DB sweep
		var batch []string
		batch, _, _ = r.client.Scan(ctx, 0, "session:*", 20).Result()
		if len(batch) > 0 {
			log.Printf("Repository: Shallow SCAN found %d initial keys", len(batch))
			keys = batch
		}

		// 2. Trigger Background Full Rebuild
		if _, loaded := r.indexInFlight.LoadOrStore("rebuild", true); !loaded {
			go func() {
				defer r.indexInFlight.Delete("rebuild")
				bgCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
				defer cancel()
				
				log.Printf("BACKGROUND INDEX REBUILD START")
				var cursor uint64
				var allKeys []string
				for {
					var b []string
					b, cursor, err = r.client.Scan(bgCtx, cursor, "session:*", 250).Result()
					if err != nil { break }
					allKeys = append(allKeys, b...)
					if cursor == 0 || len(allKeys) >= MaxCandidates*4 { break }
				}

				if len(allKeys) > 0 {
					var ids []interface{}
					for _, k := range allKeys {
						id := strings.TrimPrefix(k, "session:")
						ids = append(ids, id)
					}
					// Ensure index is set type
					r.client.Del(bgCtx, "sessions:index")
					r.client.SAdd(bgCtx, "sessions:index", ids...)
					r.client.Expire(bgCtx, "sessions:index", 1*time.Hour)
					log.Printf("BACKGROUND INDEX REBUILD SUCCESS: Indexed %d sessions", len(allKeys))
				}
			}()
		}
	}

	log.Printf("Repository: Processing %d candidate keys", len(keys))

	// Collect and parse all session JSONs using MGet
	if len(keys) > 0 {
		var subKeys []string
		for _, key := range keys {
			// Key might be "session:<id>" or just "<id>" depending on index contents
			if !strings.HasPrefix(key, "session:") {
				key = "session:" + key
			}
			if key != "session:"+excludeUserId {
				subKeys = append(subKeys, key)
			}
		}

		if len(subKeys) > 0 {
			values, err := r.client.MGet(ctx, subKeys...).Result()
			if err != nil {
				return nil, fmt.Errorf("mget failed: %w", err)
			}

			for i, val := range values {
				if val == nil {
					continue
				}
				s, err := r.unmarshalSession(val.(string))
				if err != nil {
					log.Printf("Warning: Failed to parse session %s: %v", subKeys[i], err)
					continue
				}
				sessions = append(sessions, *s)
				if len(sessions) >= MaxCandidates {
					break
				}
			}
		}
	}

	log.Printf("Repository: Successfully fetched %d filtered candidates", len(sessions))
	return sessions, nil
}

func (r *RedisRepository) GetSession(ctx context.Context, userId string) (*models.SoloSession, error) {
	// Phase 1.5 Strict Parity: Try exact key match first
	key := "session:" + userId
	log.Printf("Repository: Looking up exact session key: %s", key)

	data, err := r.client.Get(ctx, key).Result()
	if err != nil {
		if err == redis.Nil {
			log.Printf("Repository: Key %s not found", key)
			return nil, nil
		}
		return nil, fmt.Errorf("get session failed: %w", err)
	}

	return r.unmarshalSession(data)
}

func (r *RedisRepository) unmarshalSession(data string) (*models.SoloSession, error) {
	var s models.SoloSession
	if err := json.Unmarshal([]byte(data), &s); err != nil {
		return nil, err
	}

	// Phase 1.5 Robustness: Normalize UserId/ClerkUserId
	// We prefer root userId, but check clerkUserId and nested structures for parity with Admin logic
	if s.UserId == "" {
		if s.ClerkUserId != "" {
			s.UserId = s.ClerkUserId
		} else if s.Static != nil && s.Static.ClerkUserId != "" {
			s.UserId = s.Static.ClerkUserId
		} else if s.StaticAttributes != nil && s.StaticAttributes.ClerkUserId != "" {
			s.UserId = s.StaticAttributes.ClerkUserId
		}
	}

	// Normalize StaticAttributes if only Static exists
	if s.StaticAttributes == nil && s.Static != nil {
		s.StaticAttributes = s.Static
	}

	return &s, nil
}

func (r *RedisRepository) GetCache(ctx context.Context, key string) (string, error) {
	return r.client.Get(ctx, key).Result()
}

func (r *RedisRepository) SetCache(ctx context.Context, key string, value string, expiration time.Duration) error {
	return r.client.Set(ctx, key, value, expiration).Err()
}

// SetNX performs an atomic SET if Not eXists operation.
// Returns true if the key was set, false if it already exists.
func (r *RedisRepository) SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) (bool, error) {
	return r.client.SetNX(ctx, key, value, expiration).Result()
}
