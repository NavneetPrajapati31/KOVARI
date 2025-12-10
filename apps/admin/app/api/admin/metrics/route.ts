import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/admin-lib/supabaseAdmin";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { getRedisAdminClient } from "@/admin-lib/redisAdmin";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();

    const redis = getRedisAdminClient();

    // 1) Counts from Supabase (use count + head)
    const [
      { count: totalUsers },
      { count: totalProfiles },
      { count: bannedUsers },
      { count: pendingFlags },
      { count: activeGroups },
      { count: flaggedGroups },
    ] = await Promise.all([
      supabaseAdmin.from("users").select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("profiles")
        .select("*", { count: "exact", head: true }),
      supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("banned", true),
      supabaseAdmin
        .from("user_flags")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
      supabaseAdmin
        .from("groups")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabaseAdmin
        .from("groups")
        .select("*", { count: "exact", head: true })
        .gt("flag_count", 0),
    ]);

    // 2) Active sessions from Redis
    let activeSessions = 0;
    try {
      activeSessions = await redis.sCard("sessions:index");
    } catch (e) {
      console.error("Redis sessions:index SCARD failed:", e);
    }

    return NextResponse.json({
      totalUsers: totalUsers ?? 0,
      totalProfiles: totalProfiles ?? 0,
      bannedUsers: bannedUsers ?? 0,
      pendingFlags: pendingFlags ?? 0,
      activeGroups: activeGroups ?? 0,
      flaggedGroups: flaggedGroups ?? 0,
      activeSessions,
    });
  } catch (err: unknown) {
    console.error("Admin metrics error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 401 }
    );
  }
}
