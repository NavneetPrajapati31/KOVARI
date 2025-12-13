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
        
        // Extract fields for searching
        const userId = 
          parsed?.static?.clerkUserId ?? 
          parsed?.static_attributes?.clerkUserId ?? 
          parsed?.userId ?? 
          null;
        
        const destObj = parsed?.travel?.destination ?? parsed?.destination;
        const destination = destObj
          ? (typeof destObj === "string" ? destObj : destObj?.name ?? null)
          : null;

        // Check if search term matches
        const keyMatch = key.toLowerCase().includes(searchTerm);
        const userIdMatch = userId && userId.toLowerCase().includes(searchTerm);
        const destMatch = destination && destination.toLowerCase().includes(searchTerm);

        if (keyMatch || userIdMatch || destMatch) {
          const ttl = await redis.ttl(key);
          
          matchingSessions.push({
            sessionKey: key,
            userId,
            createdAt: parsed?.createdAt ?? parsed?.created_at ?? null,
            ttlSeconds: typeof ttl === "number" && ttl >= 0 ? ttl : null,
            destination,
            budget: parsed?.travel?.budget ?? parsed?.budget ?? null,
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

