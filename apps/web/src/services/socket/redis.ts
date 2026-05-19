import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const isLocalhost = REDIS_URL.includes("localhost") || REDIS_URL.includes("127.0.0.1");
console.log(`[Redis] URL: ${isLocalhost ? "LOCALHOST" : "REMOTE (checking connectivity…)"}`);

export const pubClient = createClient({ url: REDIS_URL });
export const subClient = pubClient.duplicate();

// Silent error handlers — we log in connectRedis, not here
pubClient.on("error", () => {});
subClient.on("error", () => {});

/**
 * Attempt to connect Redis clients.
 * Returns `true` if both connected, `false` if unavailable.
 * Fails fast with a 5-second timeout so the server isn't blocked.
 */
export const connectRedis = async (): Promise<boolean> => {
  const TIMEOUT_MS = 5_000;

  const withTimeout = <T>(promise: Promise<T>, label: string): Promise<T> =>
    Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS)
      ),
    ]);

  try {
    if (!pubClient.isOpen) {
      await withTimeout(pubClient.connect(), "Redis PubClient");
    }
    if (!subClient.isOpen) {
      await withTimeout(subClient.connect(), "Redis SubClient");
    }
    console.log("[Redis] ✅ Connected");
    return true;
  } catch (err: any) {
    console.warn(`[Redis] ⚠️  Unavailable: ${err?.message ?? err}`);
    return false;
  }
};

export const redisAdapter = createAdapter(pubClient, subClient);
