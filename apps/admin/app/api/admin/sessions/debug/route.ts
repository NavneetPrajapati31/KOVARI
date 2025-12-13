// apps/admin/app/api/admin/sessions/debug/route.ts
import { NextResponse } from "next/server";
import { ensureRedisConnection } from "../../../../../lib/redisAdmin";

export async function GET() {
  try {
    const redisClient = await ensureRedisConnection();
    
    // Test Redis connection
    const pingResult = await redisClient.ping();
    console.log("[DEBUG] Redis ping:", pingResult);
    
    // Get all session keys
    const keys = await redisClient.keys("session:*");
    console.log("[DEBUG] Found session keys:", keys.length);
    
    // Get sample session data
    const sampleKeys = keys.slice(0, 3);
    const sampleSessions = [];
    
    for (const key of sampleKeys) {
      const raw = await redisClient.get(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          sampleSessions.push({
            key,
            data: parsed,
            ttl: await redisClient.ttl(key),
          });
        } catch {
          sampleSessions.push({
            key,
            error: "Failed to parse JSON",
            raw: raw.substring(0, 100),
          });
        }
      }
    }
    
    return NextResponse.json({
      redisConnection: pingResult === "PONG" ? "OK" : "FAILED",
      totalSessions: keys.length,
      sampleKeys: keys.slice(0, 10),
      sampleSessions,
    });
  } catch (err) {
    console.error("[DEBUG] Error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

