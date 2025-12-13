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
        
        // Type guard: ensure parsed is an object
        const parsedObj: Record<string, unknown> | null = parsed && typeof parsed === "object" && parsed !== null 
          ? (parsed as Record<string, unknown>)
          : null;
        
        // Debug logging with type-safe access
        const debugDest = parsedObj ? parsedObj["destination"] : undefined;
        const debugUserId = parsedObj ? parsedObj["userId"] : undefined;
        const debugBudget = parsedObj ? parsedObj["budget"] : undefined;
        console.log("[TEST] Parsed data:", {
          hasUserId: !!debugUserId,
          userId: debugUserId,
          hasDestination: !!debugDest,
          destination: debugDest,
          destinationType: debugDest ? typeof debugDest : "null",
          destinationName: debugDest && typeof debugDest === "object" && debugDest !== null 
            ? (debugDest as Record<string, unknown>)?.name 
            : null,
          hasBudget: debugBudget !== undefined,
          budget: debugBudget,
        });
        
        // Test extraction logic
        const staticObj = parsedObj && typeof parsedObj["static"] === "object" && parsedObj["static"] !== null
          ? parsedObj["static"] as Record<string, unknown> 
          : null;
        const staticAttrs = parsedObj && typeof parsedObj["static_attributes"] === "object" && parsedObj["static_attributes"] !== null
          ? parsedObj["static_attributes"] as Record<string, unknown>
          : null;
        const userId = 
          (staticObj && typeof staticObj["clerkUserId"] === "string" ? staticObj["clerkUserId"] : null) ??
          (staticAttrs && typeof staticAttrs["clerkUserId"] === "string" ? staticAttrs["clerkUserId"] : null) ??
          (parsedObj && typeof parsedObj["userId"] === "string" ? parsedObj["userId"] : null) ??
          null;
        
        // Extract destination - handle both object and string formats
        let destination: string | null = null;
        const travelObj = parsedObj && typeof parsedObj["travel"] === "object" && parsedObj["travel"] !== null
          ? parsedObj["travel"] as Record<string, unknown>
          : null;
        const destObj = travelObj ? travelObj["destination"] : (parsedObj ? parsedObj["destination"] : undefined);
        if (destObj) {
          if (typeof destObj === "string") {
            destination = destObj;
          } else if (destObj && typeof destObj === "object") {
            const dest = destObj as Record<string, unknown>;
            destination = (dest && typeof dest["name"] === "string") ? dest["name"] : null;
          }
        }
        
        // Extract budget
        const budget = 
          (travelObj && travelObj["budget"] !== undefined ? travelObj["budget"] : null) ??
          (parsedObj && parsedObj["budget"] !== undefined ? parsedObj["budget"] : null) ??
          null;
        const budgetNum = typeof budget === "number" ? budget : null;
        
        console.log("[TEST] Extracted values:", {
          userId,
          destination,
          budget: budgetNum,
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
            budget: budgetNum,
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

