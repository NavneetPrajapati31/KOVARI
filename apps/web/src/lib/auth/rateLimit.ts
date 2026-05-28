import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

let redis: Redis | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
} catch (e) {
  console.warn("Could not initialize Upstash Redis:", e);
}

// 5 requests per 10 seconds for login attempts
const loginRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 s"),
  analytics: true,
  prefix: "@upstash/ratelimit/login",
}) : null;

// 3 requests per 1 minute for OTP resends
const otpRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  analytics: true,
  prefix: "@upstash/ratelimit/otp",
}) : null;

export const checkRateLimit = async (
  req: NextRequest, 
  type: 'login' | 'otp' = 'login'
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> => {
  const limiter = type === 'otp' ? otpRateLimit : loginRateLimit;
  
  if (!limiter) {
    // Fail open if Redis is not configured (especially for local dev)
    return { success: true, limit: 100, remaining: 99, reset: 0 };
  }
  
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
  const result = await limiter.limit(ip);
  return result;
};
