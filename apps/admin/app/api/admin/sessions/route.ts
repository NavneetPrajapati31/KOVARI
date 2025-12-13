// apps/admin/app/api/admin/sessions/route.ts
import { NextResponse } from "next/server";
import redis, { ensureRedisConnection, parseSessionValue } from "../../../../lib/redisAdmin";
import { requireAdmin } from "../../../../lib/adminAuth";



export async function GET(req: Request) {
  // verify admin
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const useIndex = url.searchParams.get("useIndex") === "true";
  const start = Math.max(0, Number(url.searchParams.get("start") || "0"));
  const cursor = url.searchParams.get("cursor") || "0";
  let limit = Number(url.searchParams.get("limit") || "20");
  if (Number.isNaN(limit) || limit <= 0) limit = 20;
  limit = Math.min(limit, 100); // cap to 100 for safety

  try {
    const redisClient = await ensureRedisConnection();
    
    // Test Redis connection
    try {
      await redisClient.ping();
      console.log("[GET /api/admin/sessions] Redis connection: OK");
    } catch (pingErr) {
      console.error("[GET /api/admin/sessions] Redis ping failed:", pingErr);
    }
    
    console.log("[GET /api/admin/sessions] Starting session fetch", {
      useIndex,
      start,
      cursor,
      limit,
    });

    // Prefer index if requested
    if (useIndex) {
      try {
        // Try to read sessions:index as a LIST first
        const end = start + limit - 1;
        let sessionKeys: string[] = await redis.lRange("sessions:index", start, end);
        console.log("[GET /api/admin/sessions] Index LRANGE result:", {
          keysFound: sessionKeys?.length || 0,
          isArray: Array.isArray(sessionKeys),
        });
        
        // If lRange returns empty, try reading as JSON string (some scripts store it that way)
        if (!Array.isArray(sessionKeys) || sessionKeys.length === 0) {
          const indexData = await redis.get("sessions:index");
          console.log("[GET /api/admin/sessions] Index GET result:", indexData ? "exists" : "null");
          if (indexData) {
            try {
              const parsed = JSON.parse(indexData);
              if (Array.isArray(parsed)) {
                // Extract full session keys from userIds if needed
                sessionKeys = parsed
                  .slice(start, start + limit)
                  .map((id: string) => (id.startsWith("session:") ? id : `session:${id}`));
                console.log("[GET /api/admin/sessions] Index JSON parsed, keys:", sessionKeys.length);
              }
            } catch {
              // Not JSON, ignore and fall through to SCAN
              console.log("[GET /api/admin/sessions] Index data is not JSON array, falling through to SCAN");
            }
          } else {
            console.log("[GET /api/admin/sessions] No index data found, falling through to SCAN");
          }
        }

        if (Array.isArray(sessionKeys) && sessionKeys.length > 0) {
          console.log("[GET /api/admin/sessions] Using index path with", sessionKeys.length, "keys");
          // Fetch all values in parallel
          const values = await Promise.all(sessionKeys.map((k) => redis.get(k)));
          const sessions = [];
          
          // Filter out stale keys (where value is null - key expired or deleted)
          for (let i = 0; i < sessionKeys.length && sessions.length < limit; i++) {
            const key = sessionKeys[i];
            const raw = values[i];
            
            // Skip if key doesn't exist (stale index entry)
            if (!raw) continue;
            
            const parsed = parseSessionValue(raw);
            const ttl = await redis.ttl(key);
            
            // Type guard: ensure parsed is an object
            const parsedObj = parsed && typeof parsed === "object" && parsed !== null 
              ? parsed as Record<string, unknown> 
              : null;
            
            // Extract userId - check multiple possible locations
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
            
            // Extract budget - check multiple possible locations
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
            
            const sessionData = {
              sessionKey: key,
              userId,
              createdAt,
              ttlSeconds: typeof ttl === "number" && ttl >= 0 ? ttl : null,
              destination,
              budget: budgetNum,
            };
            
            // Debug log for first session
            if (sessions.length === 0) {
              console.log("[GET /api/admin/sessions] Sample extracted session:", sessionData);
              console.log("[GET /api/admin/sessions] Raw parsed data:", {
                hasUserId: !!(parsedObj?.userId),
                hasDestination: !!(parsedObj?.destination),
                destinationType: parsedObj?.destination ? typeof parsedObj.destination : "null",
                hasBudget: parsedObj?.budget !== undefined,
              });
            }
            
            sessions.push(sessionData);
          }
          
          return NextResponse.json({ sessions, nextCursor: start + sessionKeys.length }, { status: 200 });
        }
        // if index exists but returned empty, fall through to SCAN
      } catch (err) {
        // index read failed: log & fallback to SCAN
        console.warn("sessions:index read failed, falling back to SCAN:", err);
      }
    }

    // SCAN fallback - fetches real-time session keys directly from Redis
    // This ensures we get all current sessions even if index is stale
    console.log("[GET /api/admin/sessions] Falling back to SCAN (index not available or empty)");
    const match = "session:*";
    const count = Math.max(50, limit * 3);
    // Use node-redis v4 scan signature
    const scanRes = await redis.scan(cursor, { MATCH: match, COUNT: count });
    const nextCursor = scanRes.cursor;
    const keys: string[] = scanRes.keys ?? [];
    
    console.log("[GET /api/admin/sessions] SCAN result:", {
      cursor: nextCursor,
      keysFound: keys.length,
      firstFewKeys: keys.slice(0, 5),
    });

    const sessions = [];
    if (keys.length > 0) {
      // Fetch values directly (more reliable than pipeline for debugging)
      console.log("[GET /api/admin/sessions] Fetching", keys.length, "session values...");
      
      for (let i = 0; i < keys.length && sessions.length < limit; i++) {
        const key = keys[i];
        
        try {
          const raw = await redis.get(key);
          
          if (!raw) {
            console.log(`[GET /api/admin/sessions] Key ${key} has no value, skipping`);
            continue;
          }
          
          const parsed = parseSessionValue(raw);
          const ttl = await redis.ttl(key);
          
          // Type guard: ensure parsed is an object
          const parsedObj = parsed && typeof parsed === "object" && parsed !== null 
            ? parsed as Record<string, unknown> 
            : null;
          
          // Extract userId - check multiple possible locations
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
          
          // Extract budget - check multiple possible locations
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
          
          const sessionData = {
            sessionKey: key,
            userId,
            createdAt,
            ttlSeconds: typeof ttl === "number" && ttl >= 0 ? ttl : null,
            destination,
            budget: budgetNum,
          };
          
          // Debug log for first session
          if (sessions.length === 0) {
            console.log("[GET /api/admin/sessions] Sample extracted session (SCAN):", sessionData);
            console.log("[GET /api/admin/sessions] Raw parsed data (SCAN):", {
              hasUserId: !!(parsedObj?.userId),
              hasDestination: !!(parsedObj?.destination),
              destinationType: parsedObj?.destination ? typeof parsedObj.destination : "null",
              hasBudget: parsedObj?.budget !== undefined,
            });
          }
          
          sessions.push(sessionData);
        } catch (keyErr) {
          console.error(`[GET /api/admin/sessions] Error processing key ${key}:`, keyErr);
          continue;
        }
      }
    }

    console.log("[GET /api/admin/sessions] Returning sessions", {
      count: sessions.length,
      nextCursor,
      sampleSession: sessions[0] || null,
    });
    
    return NextResponse.json({ sessions, nextCursor }, { status: 200 });
  } catch (err) {
    console.error("GET /api/admin/sessions error:", err);
    return NextResponse.json({ error: "Failed to list sessions" }, { status: 500 });
  }
}
