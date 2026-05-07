import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@kovari/api";
import { getAuthenticatedUser } from "@/lib/auth/get-user";

/**
 * GET /api/reports/targets
 * Fetches users or groups for reporting.
 * If ?q= is provided, it searches by name.
 * Handles both Web (Clerk) and Mobile (JWT) authentication.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const internalUserId = authUser.id;
    const searchParams = req.nextUrl.searchParams;
    const type = searchParams.get("type") || "user";
    const query = searchParams.get("q") || "";

    const supabase = createAdminSupabaseClient();
    let data: any[] = [];

    if (type === "user") {
      // 1. Fetch connected user IDs
      let connectedIds: string[] = [];
      try {
        const [follows, matches] = await Promise.all([
          supabase
            .from("user_follows")
            .select("follower_id, following_id")
            .or(`follower_id.eq.${internalUserId},following_id.eq.${internalUserId}`)
            .limit(200),
          supabase
            .from("match_interests")
            .select("from_user_id, to_user_id")
            .or(`from_user_id.eq.${internalUserId},to_user_id.eq.${internalUserId}`)
            .eq("status", "accepted")
            .limit(100)
        ]);

        const idSet = new Set<string>();
        (follows.data || []).forEach(f => {
          if (f.follower_id && f.follower_id !== internalUserId) idSet.add(f.follower_id);
          if (f.following_id && f.following_id !== internalUserId) idSet.add(f.following_id);
        });
        (matches.data || []).forEach(m => {
          if (m.from_user_id && m.from_user_id !== internalUserId) idSet.add(m.from_user_id);
          if (m.to_user_id && m.to_user_id !== internalUserId) idSet.add(m.to_user_id);
        });
        connectedIds = Array.from(idSet);
      } catch (err) {
        console.error("[REPORT_TARGETS] Error fetching connections:", err);
      }

      const searchTerm = query.trim();

      if (!searchTerm) {
        // CASE A: Empty search - show all connections (up to 20)
        if (connectedIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, name, username, profile_photo")
            .in("user_id", connectedIds)
            .limit(20);

          if (profiles) {
            data = profiles.map(p => ({
              id: p.user_id,
              name: p.name || p.username || "User",
              username: p.username,
              imageUrl: p.profile_photo
            }));
          }
        }
      } else {
        // CASE B: Search query provided - prioritize connections, then fallback global
        // 1. Try connections first
        if (connectedIds.length > 0) {
          const { data: connectionResults } = await supabase
            .from("profiles")
            .select("user_id, name, username, profile_photo")
            .in("user_id", connectedIds)
            .or(`name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
            .limit(20);

          if (connectionResults && connectionResults.length > 0) {
            data = connectionResults.map(p => ({
              id: p.user_id,
              name: p.name || p.username || "User",
              username: p.username,
              imageUrl: p.profile_photo
            }));
          }
        }

        // 2. Global fallback if no results from connections
        if (data.length === 0) {
          const { data: globalResults } = await supabase
            .from("profiles")
            .select("user_id, name, username, profile_photo")
            .neq("user_id", internalUserId)
            .or(`name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`)
            .limit(20);

          if (globalResults) {
            data = globalResults.map(p => ({
              id: p.user_id,
              name: p.name || p.username || "User",
              username: p.username,
              imageUrl: p.profile_photo
            }));
          }
        }
      }
    } else {
      // Group search: creator or member
      const { data: creatorGroups } = await supabase
        .from("groups")
        .select("id, name, cover_image")
        .eq("creator_id", internalUserId)
        .eq("status", "active");

      const { data: memberGroups } = await supabase
        .from("group_memberships")
        .select("group_id, groups!inner(id, name, cover_image, status)")
        .eq("user_id", internalUserId)
        .eq("status", "accepted");

      const uniqueGroups = new Map<string, any>();
      (creatorGroups || []).forEach(g => uniqueGroups.set(g.id, g));
      (memberGroups || []).forEach(m => {
        const group = Array.isArray(m.groups) ? m.groups[0] : m.groups;
        if (group && group.status === "active") {
          uniqueGroups.set(group.id, group);
        }
      });

      data = Array.from(uniqueGroups.values())
        .filter(g => !query || g.name?.toLowerCase().includes(query.toLowerCase()))
        .map(g => ({
          id: g.id,
          name: g.name,
          imageUrl: g.cover_image
        }));
    }

    return NextResponse.json({ targets: data });
  } catch (error: any) {
    console.error("[REPORT_TARGETS] Critical failure:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}


