// apps/admin/app/api/admin/sessions/test/route.ts
import { NextResponse } from "next/server";
import { ensureRedisConnection, parseSessionValue } from "../../../../../lib/redisAdmin";

export async function GET() {
  try {
    const redisClient = await ensureRedisConnection();
    
    // Test 1: Redis connection
    const pingResult = await redisClient.ping();
    console.log("[TEST] Redis ping:", pingResult);
    
    // Test 2: Get session keys using SCAN
    const scanRes = await redisClient.scan("0", { MATCH: "session:*", COUNT: 50 });
    const keys = scanRes.keys ?? [];
    console.log("[TEST] SCAN found keys:", keys.length);
    console.log("[TEST] First 5 keys:", keys.slice(0, 5));
    
    // Test 3: Get one session and parse it
    if (keys.length > 0) {
      const testKey = keys[0];
      const raw = await redisClient.get(testKey);
      console.log("[TEST] Raw data for", testKey, ":", raw ? "exists" : "null");
      
      if (raw) {
        const parsed = parseSessionValue(raw);
        console.log("[TEST] Parsed data:", {
          hasUserId: !!parsed?.userId,
          userId: parsed?.userId,
          hasDestination: !!parsed?.destination,
          destination: parsed?.destination,
          destinationType: typeof parsed?.destination,
          destinationName: parsed?.destination?.name,
          hasBudget: parsed?.budget !== undefined,
          budget: parsed?.budget,
        });
        
        // Test extraction logic
        const userId = 
          parsed?.static?.clerkUserId ?? 
          parsed?.static_attributes?.clerkUserId ?? 
          parsed?.userId ?? 
          null;
        
        let destination: string | null = null;
        const destObj = parsed?.travel?.destination ?? parsed?.destination;
        if (destObj) {
          destination = typeof destObj === "string" ? destObj : destObj?.name ?? null;
        }
        
        const budget = parsed?.travel?.budget ?? parsed?.budget ?? null;
        
        console.log("[TEST] Extracted values:", {
          userId,
          destination,
          budget,
        });
        
        return NextResponse.json({
          success: true,
          redisConnection: pingResult === "PONG" ? "OK" : "FAILED",
          totalSessions: keys.length,
          testKey,
          rawData: raw.substring(0, 200),
          parsedData: parsed,
          extracted: {
            userId,
            destination,
            budget,
          },
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      redisConnection: pingResult === "PONG" ? "OK" : "FAILED",
      totalSessions: keys.length,
      message: "No sessions found to test",
    });
  } catch (err) {
    console.error("[TEST] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
        stack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}

