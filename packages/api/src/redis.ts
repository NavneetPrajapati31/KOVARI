// lib/redis.ts
// Prevent accidental client-side imports
if (typeof window !== "undefined") {
  throw new Error(
    "Do not import lib/redis in client code. Use server APIs instead."
  );
}
import { createClient } from "redis";

let _redis: ReturnType<typeof createClient> | null = null;

export const getRedisClient = () => {
  if (_redis) return _redis;

  // Next.js handles .env.local loading automatically, so we just read from process.env
  const redisUrl = process.env.REDIS_URL;

  // Debug environment variables (only in Node.js runtime, not Edge)
  if (typeof process !== "undefined" && process.env) {
    if (process.env.NODE_ENV === "development") {
      console.log("🔍 Redis Configuration:");
      console.log("  - REDIS_URL:", redisUrl ? "✅ Set" : "❌ Not set");
      console.log("  - NODE_ENV:", process.env.NODE_ENV);
      console.log("  - Using URL:", redisUrl || "redis://localhost:6380");
    }

    if (!redisUrl) {
      console.warn("⚠️ REDIS_URL not found in environment variables");
      console.warn("⚠️ Using default redis://localhost:6380");
    }
  }

  _redis = createClient({
    url: redisUrl || "redis://localhost:6380",
  });

  _redis.on("error", (err: any) => {
    console.error("❌ Redis Client Error:", err);
    if (err.message.includes("ECONNREFUSED")) {
      console.error(
        "💡 This usually means Redis is not accessible at the specified URL"
      );
      console.error("💡 Check if your REDIS_URL is correct and Redis is running");
      if (redisUrl) {
        console.error(
          "💡 Current REDIS_URL:",
          redisUrl.replace(/:[^@]*@/, ":***@")
        );
      }
    }
  });

  _redis.on("connect", () => console.log("✅ Redis connected successfully"));
  _redis.on("ready", () => console.log("✅ Redis ready for commands"));

  return _redis;
};

// Export a proxy for backward compatibility that lazy-loads the client
export const redis = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop, receiver) {
    const client = getRedisClient();
    return Reflect.get(client, prop, receiver);
  },
  apply(target, thisArg, argArray) {
    const client = getRedisClient();
    return Reflect.apply(client as any, thisArg, argArray);
  }
});

export default redis;

// Helper function to ensure Redis is connected
export async function ensureRedisConnection() {
  const client = getRedisClient();
  if (!client.isOpen) {
    console.log("🔌 Connecting to Redis...");
    await client.connect();
  }
  return client;
}

// Parse session value from Redis (handles JSON strings, null, and invalid JSON)
export function parseSessionValue(raw: string | null): unknown {
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}


