import { pubClient } from "./redis";

export class RateLimiter {
  /**
   * Asserts whether a user is permitted to send a message based on a sliding expiration window.
   */
  static async checkRateLimit(userId: string, limit: number, windowSeconds: number): Promise<boolean> {
    if (!userId) return false;
    
    try {
      const key = `rate_limit:messages:${userId}`;
      
      // Increment the counter atomically
      const current = await pubClient.incr(key);
      
      // If it's the first execution in the window, set its expiry
      if (current === 1) {
        await pubClient.expire(key, windowSeconds);
      }
      
      // If over limit, reject
      if (current > limit) {
        return false;
      }
      
      return true;
    } catch (err) {
      console.error("[RateLimiter] Error:", err);
      // Failsafe to true if Redis glitches to avoid blocking chat entirely
      return true;
    }
  }
}
