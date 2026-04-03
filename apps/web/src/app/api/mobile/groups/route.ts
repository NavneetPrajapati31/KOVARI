import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { createAdminSupabaseClient } from "@kovari/api";

/**
 * GET /api/mobile/groups
 * Fetch groups joined by the current mobile user with high-fidelity parity to web.
 */
export async function GET(req: NextRequest) {
  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = authUser.id; // internal Supabase UUID
  const supabase = createAdminSupabaseClient();

  try {
    // 1. Fetch memberships where status is 'accepted'
    const { data: memberships, error: membershipError } = await supabase
      .from("group_memberships")
      .select("group_id")
      .eq("user_id", userId)
      .eq("status", "accepted");

    if (membershipError) {
      console.error("Error fetching group memberships:", membershipError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const groupIds = memberships.map((m) => m.group_id);

    if (groupIds.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 2. Fetch the groups with those IDs
    const { data: groupsData, error: groupsError } = await supabase
      .from("groups")
      .select(`
        id,
        name,
        is_public,
        destination,
        start_date,
        end_date,
        creator_id,
        created_at,
        cover_image,
        members_count,
        status
      `)
      .in("id", groupIds)
      .in("status", ["active", "pending"])
      .neq("status", "removed")
      .order("created_at", { ascending: false });

    if (groupsError) {
      console.error("Error fetching groups:", groupsError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!groupsData || groupsData.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // 3. Fetch additional data for mapping (Creator profiles)
    const creatorIds = [...new Set(groupsData.map((g) => g.creator_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, username, profile_photo")
      .in("user_id", creatorIds);

    if (profilesError) {
      console.error("Error fetching creator profiles:", profilesError);
    }

    const profilesMap = (profilesData || []).reduce((acc: any, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {});

    // 4. Map data to the interface mobile expects
    const mappedGroups = groupsData.map((group) => {
      const creator = profilesMap[group.creator_id];
      return {
        id: group.id,
        name: group.name,
        privacy: group.is_public ? "public" : "private",
        destination: group.destination,
        dateRange: {
          start: group.start_date,
          end: group.end_date,
          isOngoing: !group.end_date,
        },
        memberCount: group.members_count || 0,
        userStatus: "member", // User is always a member in this context
        creator: {
          name: creator?.name || "Unknown",
          username: creator?.username || "unknown",
          avatar: creator?.profile_photo,
        },
        creatorId: group.creator_id,
        created_at: group.created_at,
        cover_image: group.cover_image,
        status: group.status,
      };
    });

    return NextResponse.json({ data: mappedGroups });
  } catch (error: any) {
    console.error("Unexpected error in GET /api/mobile/groups:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
