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

    // Gather candidate keys from all known patterns
    const patterns = ["session:*", "sessions:*", "session:user:*"];
    const keySet = new Set<string>();
    for (const pattern of patterns) {
      for await (const key of redis.scanIterator({
        MATCH: pattern,
        COUNT: 500,
      })) {
        const raw = String(key);
        if (!raw) continue;
        // Some stores may have accidentally saved a comma-joined list as a single key.
        // Split on commas to recover individual keys.
        const parts = raw
          .split(",")
          .map((p) => p.trim())
          .filter(Boolean);
        if (parts.length > 1) {
          parts.forEach((p) => keySet.add(p));
        } else {
          keySet.add(raw);
        }
      }
    }
    // Remove the index key if present
    keySet.delete("sessions:index");
    const keys = Array.from(keySet);

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
        const [keyType, ttlMs] = await Promise.all([
          redis.type(key),
          redis.pTTL(key), // -1 no expire, -2 missing
        ]);

        let data: unknown = null;
        let missing = false;

        if (keyType === "string") {
          const raw = await redis.get(key);
          if (!raw) {
            missing = true;
          } else {
            try {
              data = JSON.parse(raw);
            } catch {
              data = raw;
            }
          }
        } else if (keyType === "hash") {
          data = await redis.hGetAll(key);
        } else if (keyType === "list") {
          data = await redis.lRange(key, 0, -1);
        } else if (keyType === "set") {
          data = await redis.sMembers(key);
        } else if (keyType === "zset") {
          data = await redis.zRangeWithScores(key, 0, -1);
        } else {
          // unknown type, skip
          missing = true;
        }

        sessions.push({
          key,
          type: keyType,
          ttlMs,
          ttlSeconds: ttlMs > 0 ? Math.floor(ttlMs / 1000) : ttlMs,
          data,
          missing,
        });
      } catch (e) {
        console.error("Error reading session", key, e);
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
