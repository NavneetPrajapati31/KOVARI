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

	opts.DialTimeout = 30 * time.Second
	opts.ReadTimeout = 30 * time.Second
	opts.WriteTimeout = 30 * time.Second
	opts.PoolSize = 50
	opts.PoolTimeout = 30 * time.Second
	opts.MinIdleConns = 10
	opts.MaxRetries = 5

	client := redis.NewClient(opts)
	return &RedisRepository{client: client}, nil
}

func (r *RedisRepository) Ping(ctx context.Context) error {
	return r.client.Ping(ctx).Err()
}

const MaxCandidates = 100

func (r *RedisRepository) FetchAllSessions(ctx context.Context, excludeUserId string) ([]models.SoloSession, error) {
	var sessions []models.SoloSession
	var keys []string
	var err error

	keys, err = r.client.SMembers(ctx, "sessions:index").Result()

	if err != nil || len(keys) == 0 {
		log.Printf("Repository: Index missing or empty (Total candidates: 0)")

		var batch []string
		batch, _, _ = r.client.Scan(ctx, 0, "session:*", 20).Result()
		if len(batch) > 0 {
			log.Printf("Repository: Shallow SCAN found %d initial keys", len(batch))
			keys = batch
		}

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
					if err != nil {
						break
					}
					allKeys = append(allKeys, b...)
					if cursor == 0 || len(allKeys) >= MaxCandidates*4 {
						break
					}
				}

				if len(allKeys) > 0 {
					var ids []interface{}
					for _, k := range allKeys {
						id := strings.TrimPrefix(k, "session:")
						ids = append(ids, id)
					}
					r.client.Del(bgCtx, "sessions:index")
					r.client.SAdd(bgCtx, "sessions:index", ids...)
					r.client.Expire(bgCtx, "sessions:index", 24*time.Hour)
					log.Printf("BACKGROUND INDEX REBUILD SUCCESS: Indexed %d sessions", len(allKeys))
				}
			}()
		}
	}

	log.Printf("Repository: Processing %d candidate keys", len(keys))

	if len(keys) > 0 {
		var subKeys []string
		for _, key := range keys {
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

	if s.UserId == "" {
		if s.ClerkUserId != "" {
			s.UserId = s.ClerkUserId
		} else if s.Static != nil && s.Static.ClerkUserId != "" {
			s.UserId = s.Static.ClerkUserId
		} else if s.StaticAttributes != nil && s.StaticAttributes.ClerkUserId != "" {
			s.UserId = s.StaticAttributes.ClerkUserId
		}
	}

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

func (r *RedisRepository) DelCache(ctx context.Context, key string) error {
	return r.client.Del(ctx, key).Err()
}

func (r *RedisRepository) GetSessionIndex(ctx context.Context) ([]string, error) {
	return r.client.SMembers(ctx, "sessions:index").Result()
}

func (r *RedisRepository) SetNX(ctx context.Context, key string, value interface{}, expiration time.Duration) (bool, error) {
	return r.client.SetNX(ctx, key, value, expiration).Result()
}

// MGetProfiles fetches multiple profiles by their user IDs (preferably Clerk IDs).
// It returns a map of cached profiles and a slice of userIDs that were missing from cache.
func (r *RedisRepository) MGetProfiles(ctx context.Context, userIDs []string) (map[string]*models.StaticAttributes, []string) {
	if len(userIDs) == 0 {
		return nil, nil
	}

	keys := make([]string, len(userIDs))
	for i, id := range userIDs {
		keys[i] = fmt.Sprintf("profile:%s", id)
	}

	cached := make(map[string]*models.StaticAttributes)
	var missing []string

	values, err := r.client.MGet(ctx, keys...).Result()
	if err != nil {
		log.Printf("Warning: Redis MGetProfiles failed: %v", err)
		// Graceful degradation: treat all as missing if Redis fails
		return nil, userIDs
	}

	for i, val := range values {
		id := userIDs[i]
		if val == nil {
			missing = append(missing, id)
			continue
		}

		strVal, ok := val.(string)
		if !ok {
			missing = append(missing, id)
			continue
		}

		var attr models.StaticAttributes
		if err := json.Unmarshal([]byte(strVal), &attr); err != nil {
			log.Printf("Warning: Failed to parse cached profile %s: %v", id, err)
			missing = append(missing, id)
			continue
		}
		cached[id] = &attr
	}

	return cached, missing
}

// SetProfiles writes multiple profiles to the cache using a pipeline for performance.
func (r *RedisRepository) SetProfiles(ctx context.Context, profiles map[string]*models.StaticAttributes, expiration time.Duration) {
	if len(profiles) == 0 {
		return
	}

	pipe := r.client.Pipeline()
	for id, attr := range profiles {
		data, err := json.Marshal(attr)
		if err == nil {
			// We cache it using the exact ID the caller provided.
			// Supabase FetchProfilesBatch maps to both UUID and ClerkID,
			// so this handles both if they are present in the map!
			pipe.Set(ctx, fmt.Sprintf("profile:%s", id), string(data), expiration)
		}
	}

	if _, err := pipe.Exec(ctx); err != nil {
		log.Printf("Warning: Redis SetProfiles pipeline failed: %v", err)
	}
}

// InvalidateUser busts the cache for a specific user. Call this when a user updates their profile.
func (r *RedisRepository) InvalidateUser(ctx context.Context, userID string) error {
	pipe := r.client.Pipeline()
	pipe.Del(ctx, fmt.Sprintf("profile:%s", userID))
	pipe.Del(ctx, fmt.Sprintf("prefs:%s", userID))
	
	_, err := pipe.Exec(ctx)
	if err != nil {
		log.Printf("Warning: Redis InvalidateUser failed for %s: %v", userID, err)
	}
	return err
}
