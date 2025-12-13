// apps/admin/app/api/admin/sessions/search/route.ts
import { NextResponse } from "next/server";
import redis, { ensureRedisConnection, parseSessionValue } from "../../../../../lib/redisAdmin";
import { requireAdmin } from "../../../../../lib/adminAuth";

export async function GET(req: Request) {
  // verify admin
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const query = url.searchParams.get("query") || "";
  const limit = Math.min(Number(url.searchParams.get("limit") || "100"), 200);

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "Query parameter is required" }, { status: 400 });
  }

  try {
    await ensureRedisConnection();
    const searchTerm = query.toLowerCase().trim();

    console.log("[GET /api/admin/sessions/search] Searching for:", searchTerm);

    // SCAN all session keys
    const match = "session:*";
    const allKeys: string[] = [];
    let cursor = "0";

    do {
      const scanRes = await redis.scan(cursor, { MATCH: match, COUNT: 100 });
      cursor = scanRes.cursor;
      allKeys.push(...scanRes.keys);
    } while (cursor !== "0" && allKeys.length < 500); // Limit to prevent too many scans

    console.log("[GET /api/admin/sessions/search] Found", allKeys.length, "total session keys");

    const matchingSessions = [];
    
    // Fetch and filter sessions
    for (let i = 0; i < allKeys.length && matchingSessions.length < limit; i++) {
      const key = allKeys[i];
      
      try {
        const raw = await redis.get(key);
        if (!raw) continue;

        const parsed = parseSessionValue(raw);
        
        // Type guard: ensure parsed is an object
        const parsedObj = parsed && typeof parsed === "object" && parsed !== null 
          ? parsed as Record<string, unknown> 
          : null;
        
        // Extract fields for searching
        const staticObj = parsedObj?.static && typeof parsedObj.static === "object" 
          ? parsedObj.static as Record<string, unknown> 
          : null;
        const staticAttrs = parsedObj?.static_attributes && typeof parsedObj.static_attributes === "object"
          ? parsedObj.static_attributes as Record<string, unknown>
          : null;
        const userId = 
          (staticObj?.clerkUserId && typeof staticObj.clerkUserId === "string" ? staticObj.clerkUserId : null) ??
          (staticAttrs?.clerkUserId && typeof staticAttrs.clerkUserId === "string" ? staticAttrs.clerkUserId : null) ??
          (parsedObj?.userId && typeof parsedObj.userId === "string" ? parsedObj.userId : null) ??
          null;
        
        // Extract destination - handle both object and string formats
        let destination: string | null = null;
        const travelObj = parsedObj?.travel && typeof parsedObj.travel === "object"
          ? parsedObj.travel as Record<string, unknown>
          : null;
        const destObj = travelObj?.destination ?? parsedObj?.destination;
        if (destObj) {
          if (typeof destObj === "string") {
            destination = destObj;
          } else if (destObj && typeof destObj === "object") {
            const dest = destObj as Record<string, unknown>;
            destination = (dest?.name && typeof dest.name === "string") ? dest.name : null;
          }
        }
        
        // Extract budget
        const budget = 
          (travelObj?.budget !== undefined ? travelObj.budget : null) ??
          (parsedObj?.budget !== undefined ? parsedObj.budget : null) ??
          null;
        const budgetNum = typeof budget === "number" ? budget : null;
        
        // Extract createdAt
        const createdAt = 
          (parsedObj?.createdAt && typeof parsedObj.createdAt === "string" ? parsedObj.createdAt : null) ??
          (parsedObj?.created_at && typeof parsedObj.created_at === "string" ? parsedObj.created_at : null) ??
          null;

        // Check if search term matches
        const keyMatch = key.toLowerCase().includes(searchTerm);
        const userIdMatch = userId && userId.toLowerCase().includes(searchTerm);
        const destMatch = destination && destination.toLowerCase().includes(searchTerm);

        if (keyMatch || userIdMatch || destMatch) {
          const ttl = await redis.ttl(key);
          
          matchingSessions.push({
            sessionKey: key,
            userId,
            createdAt,
            ttlSeconds: typeof ttl === "number" && ttl >= 0 ? ttl : null,
            destination,
            budget: budgetNum,
          });
        }
      } catch (keyErr) {
        console.error(`[GET /api/admin/sessions/search] Error processing key ${key}:`, keyErr);
        continue;
      }
    }

    console.log("[GET /api/admin/sessions/search] Found", matchingSessions.length, "matching sessions");

    return NextResponse.json({ 
      sessions: matchingSessions, 
      total: matchingSessions.length,
      query: searchTerm,
    }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/sessions/search error:", err);
    return NextResponse.json({ error: "Failed to search sessions" }, { status: 500 });
  }
}

