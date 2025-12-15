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
    let sessionKeys: string[] = []; // Store for reuse in safety signals
    try {
      // Active sessions count - count session:* keys directly
      // Note: sessions:index set may not be maintained, so we count keys directly
      try {
        // Try to use sessions:index if it exists (faster)
        const indexCount = await redis.sCard("sessions:index");
        if (indexCount > 0) {
          activeSessions = indexCount;
        } else {
          // Fallback: count session:* keys directly
          sessionKeys = await redis.keys("session:*");
          activeSessions = sessionKeys.length;
        }
      } catch {
        // If sessions:index doesn't exist or fails, count keys directly
        sessionKeys = await redis.keys("session:*");
        activeSessions = sessionKeys.length;
      }

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

    // 4) Safety Signals - Check for potential abuse patterns
    const safetySignals: string[] = [];

    // Safety Signal 1: Too many sessions by same user
    try {
      // Reuse sessionKeys if already fetched, otherwise fetch them
      if (sessionKeys.length === 0) {
        sessionKeys = await redis.keys("session:*");
      }
      const userSessionCounts: Record<string, number> = {};

      for (const key of sessionKeys) {
        // Extract userId from session key (format: session:{userId})
        const userId = key.replace("session:", "");
        userSessionCounts[userId] = (userSessionCounts[userId] || 0) + 1;
      }

      // Check if any user has more than 10 active sessions (threshold)
      const maxSessionsPerUser = Math.max(
        ...Object.values(userSessionCounts),
        0
      );
      if (maxSessionsPerUser > 10) {
        const usersWithManySessions = Object.entries(userSessionCounts)
          .filter(([, count]) => count > 10)
          .map(([userId]) => userId);
        safetySignals.push(
          `Multiple sessions by same user detected: ${usersWithManySessions.length} user(s) with >10 sessions (max: ${maxSessionsPerUser})`
        );
      }
    } catch (e) {
      console.warn("Failed to check sessions per user:", e);
    }

    // Safety Signal 2: Sessions created too fast (check sessions created in last hour)
    try {
      let sessionsCreatedLastHour = 0;
      try {
        const count = await redis.get("metrics:sessions:created:1h");
        sessionsCreatedLastHour = count ? parseInt(count, 10) : 0;
      } catch {
        // Counter may not exist yet
      }

      // Threshold: More than 50 sessions created in last hour
      if (sessionsCreatedLastHour > 50) {
        safetySignals.push(
          `Sessions created too fast: ${sessionsCreatedLastHour} sessions created in last hour`
        );
      }
    } catch (e) {
      console.warn("Failed to check session creation rate:", e);
    }

    // Safety Signal 3: High flag rate
    try {
      const oneHourAgo = new Date();
      oneHourAgo.setHours(oneHourAgo.getHours() - 1);
      const oneHourAgoISO = oneHourAgo.toISOString();

      // Get total users count for rate calculation
      const { count: totalUsers } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true });

      // Check flags created in last hour
      const { count: flagsLastHour } = await supabaseAdmin
        .from("user_flags")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneHourAgoISO);

      // Threshold: More than 20 flags per hour OR more than 5% of users flagged
      const flagsPerHour = flagsLastHour ?? 0;
      const userCount = totalUsers ?? 1;
      const flagRate = (flagsPerHour / userCount) * 100;

      if (flagsPerHour > 20 || flagRate > 5) {
        safetySignals.push(
          `High flag rate detected: ${flagsPerHour} flags in last hour (${flagRate.toFixed(2)}% of users)`
        );
      }
    } catch (e) {
      console.warn("Failed to check flag rate:", e);
    }

    // Safety Signal 4: High session volume (already have activeSessions)
    if (activeSessions > 500) {
      safetySignals.push(
        `High session volume: ${activeSessions} active sessions`
      );
    }

    return NextResponse.json({
      // MVP Metrics (as per requirements)
      sessionsActive: activeSessions ?? 0,
      sessionsExpiringSoon: sessionsExpiringSoon ?? 0,
      matches24h: matchesGenerated24h,
      pendingFlags: pendingFlags ?? 0,
      bannedLast7d: bannedLast7d ?? 0,
      // Safety Signals
      safetySignals: safetySignals.length > 0 ? safetySignals : [],
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
