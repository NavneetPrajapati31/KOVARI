// lib/redis.ts
import "server-only";
// Prevent accidental client-side imports
if (typeof window !== "undefined") {
  throw new Error(
    "Do not import lib/redis in client code. Use server APIs instead."
  );
}
import { createClient } from "redis";

// For Next.js, environment variables are automatically loaded
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
    console.warn("⚠️ Make sure you have a .env.local file with REDIS_URL");
    console.warn("⚠️ Or set REDIS_URL environment variable");
  }
}

const redis = createClient({
  url: redisUrl || "redis://localhost:6380",
});

redis.on("error", (err) => {
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

redis.on("connect", () => console.log("✅ Redis connected successfully"));
redis.on("ready", () => console.log("✅ Redis ready for commands"));

// Helper function to ensure Redis is connected
export async function ensureRedisConnection() {
  if (!redis.isOpen) {
    console.log("🔌 Connecting to Redis...");
    await redis.connect();
  }
  return redis;
}

export default redis;
