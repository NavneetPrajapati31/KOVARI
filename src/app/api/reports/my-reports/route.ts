import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

/**
 * GET /api/reports/my-reports
 * Fetches all reports submitted by the current user across users and groups.
 */
export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createAdminSupabaseClient();

    // Get current user's UUID
    const { data: currentUserRow, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (currentUserError || !currentUserRow) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    const reporterId = currentUserRow.id;

    // Fetch user flags
    const { data: userFlags, error: userError } = await supabase
      .from("user_flags")
      .select("*")
      .eq("reporter_id", reporterId)
      .order("created_at", { ascending: false });

    // Fetch group flags
    const { data: groupFlags, error: groupError } = await supabase
      .from("group_flags")
      .select("*")
      .eq("reporter_id", reporterId)
      .order("created_at", { ascending: false });

    if (userError) console.error("Error fetching user flags:", userError);
    if (groupError) console.error("Error fetching group flags:", groupError);

    const safeUserFlags = userFlags || [];
    const safeGroupFlags = groupFlags || [];

    // Fetch Target Details to enrich the data safely
    const targetUserIds = Array.from(new Set(safeUserFlags.map(f => f.user_id).filter(Boolean)));
    const targetGroupIds = Array.from(new Set(safeGroupFlags.map(f => f.group_id).filter(Boolean)));

    let usersDict: Record<string, string> = {};
    if (targetUserIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, name, full_name, clerk_username")
        .in("id", targetUserIds);
      
      if (usersData) {
        usersData.forEach(u => {
          usersDict[u.id] = u.name || u.full_name || u.clerk_username || "Unknown User";
        });
      }
    }

    let groupsDict: Record<string, string> = {};
    if (targetGroupIds.length > 0) {
      const { data: groupsData } = await supabase
        .from("groups")
        .select("id, name")
        .in("id", targetGroupIds);
      
      if (groupsData) {
        groupsData.forEach(g => {
          groupsDict[g.id] = g.name || "Unknown Group";
        });
      }
    }

    // Combine and format
    const formattedUserFlags = safeUserFlags.map((flag: any) => ({
      id: flag.id,
      targetType: "user",
      targetId: flag.user_id,
      targetName: usersDict[flag.user_id] || "Unknown User",
      reason: flag.reason,
      status: flag.status || "pending",
      createdAt: flag.created_at,
    }));

    const formattedGroupFlags = safeGroupFlags.map((flag: any) => ({
      id: flag.id,
      targetType: "group",
      targetId: flag.group_id,
      targetName: groupsDict[flag.group_id] || "Unknown Group",
      reason: flag.reason,
      status: flag.status || "pending",
      createdAt: flag.created_at,
    }));

    const allReports = [...formattedUserFlags, ...formattedGroupFlags].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ reports: allReports });
  } catch (error) {
    console.error("Error in GET /api/reports/my-reports:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
