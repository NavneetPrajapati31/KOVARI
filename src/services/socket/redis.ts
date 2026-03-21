import { createClient } from "redis";
import { createAdapter } from "@socket.io/redis-adapter";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const pubClient = createClient({ url: REDIS_URL });
export const subClient = pubClient.duplicate();

// Graceful error handling for Redis disconnects
pubClient.on("error", (err) => console.error("[Redis PubClient] Error:", err));
subClient.on("error", (err) => console.error("[Redis SubClient] Error:", err));

// Async connect helper function for starting the server
export const connectRedis = async () => {
    try {
        await Promise.all([pubClient.connect(), subClient.connect()]);
        console.log("[Redis] Successfully connected to Pub/Sub clients");
    } catch (err) {
        console.error("[Redis] Failed to connect to Pub/Sub:", err);
    }
}

export const redisAdapter = createAdapter(pubClient, subClient);
