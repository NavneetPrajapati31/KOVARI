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
