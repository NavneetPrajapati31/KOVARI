import { redis } from "@kovari/api";
import crypto from "crypto";
import { logger } from "@/lib/api/logger";

const CACHE_VERSION = "v1";
const REDIS_TIMEOUT = 100; // ms

// Hard Check: Is Redis properly configured for this environment?
const isRedisActive = !!process.env.REDIS_URL || process.env.NODE_ENV === "development";

/**
 * Generate a consistent cache key for matching
 */
export function generateMatchCacheKey(userId: string, type: "solo" | "group", params: any) {
  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(params))
    .digest("hex");
  return `match:${CACHE_VERSION}:${userId}:${type}:${hash}`;
}

/**
 * Get matching data from cache with Soft/Hard TTL logic
 */
export async function getMatchingCache(key: string) {
  try {
    if (!isRedisActive) return null; // Graceful skip if Redis is unconfigured

    const data = await Promise.race([
      redis.get(key),
      new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Redis Timeout")), REDIS_TIMEOUT))
    ]);

    if (!data) return null;

    const parsed = JSON.parse(data);
    const now = Date.now();
    
    return {
      data: parsed.data,
      isStale: now > parsed.softExpiry,
      isExpired: now > parsed.hardExpiry,
      version: parsed.version
    };
  } catch (err: any) {
    logger.error("REDIS-GET", "Redis Cache Get Error", err);
    return null;
  }
}

/**
 * Set matching data to cache with indexed tracking
 */
export async function setMatchingCache(userId: string, key: string, data: any, version: string) {
  try {
    if (!isRedisActive) return; // Graceful skip if Redis is unconfigured
    const payload = {
      data,
      version,
      softExpiry: Date.now() + 60 * 1000, // 1 minute
      hardExpiry: Date.now() + 5 * 60 * 1000, // 5 minutes
    };

    const multi = redis.multi();
    multi.set(key, JSON.stringify(payload), { EX: 300 }); // 5 minutes hard expiry in Redis
    multi.sAdd(`user:${userId}:match_keys`, key);
    multi.expire(`user:${userId}:match_keys`, 300);
    
    await multi.exec();
  } catch (err: any) {
    logger.error("REDIS-SET", "Redis Cache Set Error", err);
  }
}

/**
 * Invalidate all matching cache for a user instantly
 */
export async function invalidateMatchingCache(userId: string) {
  try {
    if (!isRedisActive) return; // Graceful skip if Redis is unconfigured
    const indexKey = `user:${userId}:match_keys`;
    const keys = await redis.sMembers(indexKey);
    
    if (keys.length > 0) {
      await redis.del([...keys, indexKey]);
    }
  } catch (err: any) {
    logger.error("REDIS-INVALIDATE", "Redis Cache Invalidation Error", err);
  }
}

/**
 * Standardized SWR locking check
 */
export async function tryAcquireRefreshLock(key: string): Promise<boolean> {
  try {
    const lockKey = `lock:refresh:${key}`;
    const result = await redis.set(lockKey, "1", { NX: true, EX: 30 });
    return result === "OK";
  } catch {
    return false;
  }
}
