// apps/admin/app/api/admin/sessions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { getRedisAdminClient } from "@/admin-lib/redisAdmin";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") || "1");
    const limit = Number(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const redis = getRedisAdminClient();

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

    const total = keys.length;
    const pageKeys = keys.slice(offset, offset + limit);

    const sessions = [];
    for (const key of pageKeys) {
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

    return NextResponse.json({
      total,
      page,
      limit,
      sessions,
    });
  } catch (err: unknown) {
    console.error("Admin sessions GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
