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

    // get all keys from index
    // if your index stores userIds instead of keys, adjust mapping below
    const keys = await redis.sMembers("sessions:index");

    const total = keys.length;
    const pageKeys = keys.slice(offset, offset + limit);

    const sessions = [];
    for (const key of pageKeys) {
      try {
        const ttlMs = await redis.pTTL(key); // -1 no expire, -2 missing
        const raw = await redis.get(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw);

        sessions.push({
          key,
          ttlMs,
          ttlSeconds: ttlMs > 0 ? Math.floor(ttlMs / 1000) : ttlMs,
          data: parsed,
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
