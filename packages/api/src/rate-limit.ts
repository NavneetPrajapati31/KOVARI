if (typeof window !== "undefined") {
  throw new Error("Rate limiting should only be used server-side.");
}
import { ensureRedisConnection } from "./redis";

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Basic Redis-based rate limiter.
 * @param key Unique key for the rate limit (e.g., "rate_limit:waitlist:1.2.3.4")
 * @param limit Maximum number of requests allowed in the window
 * @param windowSeconds Time window in seconds
 */
export async function checkRateLimit(
  key: string,
  limit: number = 5,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  const redis = await ensureRedisConnection();
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  const ttl = await redis.ttl(key);

  return {
    success: current <= limit,
    limit,
    remaining: Math.max(0, limit - current),
    reset: Math.max(0, ttl),
  };
}

