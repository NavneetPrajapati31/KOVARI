import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { getRedisAdminClient } from "@/admin-lib/redisAdmin";
import * as Sentry from "@sentry/nextjs";
import { incrementErrorCounter } from "@/admin-lib/incrementErrorCounter";

export async function GET(_req: NextRequest) {
  try {
    const { adminId, email } = await requireAdmin();
    Sentry.setUser({
      id: adminId,
      email: email,
    });

    const redis = getRedisAdminClient();

    // Calculate date for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();

    // 1) Redis Metrics
    let activeSessions = 0;
    let sessionsExpiringSoon = 0;
    try {
      // Active sessions count
      activeSessions = await redis.sCard("sessions:index");

      // Sessions expiring soon (next 1 hour) - optional
      // Note: This requires a sorted set "sessions:ttl" with TTL as score
      // If the sorted set doesn't exist, this will gracefully fail
      try {
        const oneHourFromNow = Date.now() + 60 * 60 * 1000;
        sessionsExpiringSoon = await redis.zCount(
          "sessions:ttl",
          0,
          oneHourFromNow
        );
      } catch (e) {
        // sessions:ttl sorted set may not exist - this is optional
        console.warn("sessions:ttl sorted set not available:", e);
      }
    } catch (e) {
      console.error("Redis metrics failed:", e);
    }

    // 2) Supabase Metrics
    const [{ count: pendingFlags }, { count: bannedLast7d }] =
      await Promise.all([
        // Pending flags
        supabaseAdmin
          .from("user_flags")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        // Banned users in last 7 days
        supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("banned", true)
          .gte("updated_at", sevenDaysAgoISO),
      ]);

    // 3) Matches generated (24h) - from Redis counter
    let matchesGenerated24h = 0;
    try {
      const count = await redis.get("metrics:matches:daily");
      matchesGenerated24h = count ? parseInt(count, 10) : 0;
    } catch (e) {
      console.error("Failed to get match counter:", e);
    }

    return NextResponse.json({
      // MVP Metrics (as per requirements)
      sessionsActive: activeSessions ?? 0,
      sessionsExpiringSoon: sessionsExpiringSoon ?? 0,
      matches24h: matchesGenerated24h,
      pendingFlags: pendingFlags ?? 0,
      bannedLast7d: bannedLast7d ?? 0,
      // Note: API error count comes from Sentry, not this API
    });
  } catch (error) {
    await incrementErrorCounter();
    Sentry.captureException(error, {
      tags: {
        scope: "admin-api",
        route: "GET /api/admin/metrics",
      },
    });
    throw error;
  }
}
