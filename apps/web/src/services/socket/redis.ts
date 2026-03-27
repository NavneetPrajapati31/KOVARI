import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
console.log(`[Redis] Using Redis URL: ${REDIS_URL.startsWith('redis://localhost') ? 'LOCALHOST (FALLBACK)' : 'PRODUCTION_URL'}`);

export const pubClient = createClient({ url: REDIS_URL });
export const subClient = pubClient.duplicate();

// Graceful error handling for Redis disconnects
pubClient.on("error", (err) => console.error("[Redis PubClient] Error:", err));
subClient.on("error", (err) => console.error("[Redis SubClient] Error:", err));

// Async connect helper function
export const connectRedis = async () => {
    if (!pubClient.isOpen) {
        try {
            await pubClient.connect();
            console.log("[Redis] PubClient connected");
        } catch (err) {
            console.error("[Redis] PubClient connection failed:", err);
        }
    }
    if (!subClient.isOpen) {
        try {
            await subClient.connect();
            console.log("[Redis] SubClient connected");
        } catch (err) {
            console.error("[Redis] SubClient connection failed:", err);
        }
    }
}

export const redisAdapter = createAdapter(pubClient, subClient);

