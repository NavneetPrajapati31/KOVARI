// apps/admin/lib/redisAdmin.ts
import { createClient } from "redis";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is not set");
}

// Simple singleton
let client: ReturnType<typeof createClient> | null = null;

export function getRedisAdminClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
    });
    client.on("error", (err) => {
      console.error("Redis error (admin):", err);
    });
    client.connect().catch((err) => {
      console.error("Failed to connect Redis (admin):", err);
    });
  }
  return client;
}

// Get the Redis client instance
const redis = getRedisAdminClient();

// Helper function to ensure Redis is connected
export async function ensureRedisConnection() {
  if (!redis.isOpen) {
    await redis.connect();
  }
  return redis;
}

// Parse session value from Redis (handles JSON parsing safely)
export function parseSessionValue(raw: string | null): unknown | null {
  if (!raw || typeof raw !== "string") {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// Default export: the Redis client
export default redis;