// apps/admin/lib/incrementErrorCounter.ts
import { getRedisAdminClient } from "@/admin-lib/redisAdmin";

/**
 * Increments the 24-hour error counter in Redis
 * This is a non-blocking operation - failures are logged but don't throw
 */
export async function incrementErrorCounter(): Promise<void> {
  try {
    const redis = getRedisAdminClient();
    await redis.incr("metrics:errors:24h");
    await redis.expire("metrics:errors:24h", 86400); // 24 hours TTL
  } catch (e) {
    console.warn("Failed to increment error counter:", e);
    // Don't throw - error tracking should never break the error flow
  }
}
