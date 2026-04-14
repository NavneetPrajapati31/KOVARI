import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@kovari/api";
import { getAuthenticatedUser } from "@/lib/auth/get-user";

/**
 * GET /api/reports/my-reports
 * Fetches all reports submitted by the current user across users and groups.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reporterId = authUser.id;
    const supabase = createAdminSupabaseClient();

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

    let usersDict: Record<string, { name: string; username?: string; imageUrl: string }> = {};
    if (targetUserIds.length > 0) {
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, name, username, profile_photo")
        .in("user_id", targetUserIds);
      
      if (profilesData) {
        profilesData.forEach(p => {
          usersDict[p.user_id] = {
            name: p.name || p.username || "Unknown User",
            username: p.username,
            imageUrl: p.profile_photo || ""
          };
        });
      }
    }

    let groupsDict: Record<string, { name: string; memberCount: number; imageUrl: string }> = {};
    if (targetGroupIds.length > 0) {
      const { data: groupsData } = await supabase
        .from("groups")
        .select("id, name, members_count, cover_image")
        .in("id", targetGroupIds);
      
      if (groupsData) {
        groupsData.forEach(g => {
          groupsDict[g.id] = {
            name: g.name || "Unknown Group",
            memberCount: g.members_count || 1,
            imageUrl: g.cover_image || ""
          };
        });
      }
    }

    const parseReasonInfo = (rawReason: string) => {
      if (!rawReason) return { reason: "", additionalNotes: "" };
      
      // Use a robust regex to split "Additional notes:" regardless of newline style (CRLF vs LF)
      const parts = rawReason.split(/(?:[\r\n]+)Additional notes:\s*/i);
      
      if (parts.length > 1) {
        return {
          reason: parts[0].trim(),
          additionalNotes: parts.slice(1).join("Additional notes: ").trim()
        };
      }
      return { reason: rawReason.trim(), additionalNotes: "" };
    };

    // Combine and format
    const formattedUserFlags = safeUserFlags.map((flag: any) => {
      const { reason, additionalNotes } = parseReasonInfo(flag.reason);
      return {
        id: flag.id,
        targetType: "user",
        targetId: flag.user_id,
        targetName: usersDict[flag.user_id]?.name || "Unknown User",
        targetUsername: usersDict[flag.user_id]?.username,
        targetImageUrl: usersDict[flag.user_id]?.imageUrl || "",
        reason,
        additionalNotes,
        evidenceUrl: flag.evidence_url || "",
        status: flag.status || "pending",
        createdAt: flag.created_at,
      };
    });

    const formattedGroupFlags = safeGroupFlags.map((flag: any) => {
      const { reason, additionalNotes } = parseReasonInfo(flag.reason);
      return {
        id: flag.id,
        targetType: "group",
        targetId: flag.group_id,
        targetName: groupsDict[flag.group_id]?.name || "Unknown Group",
        targetMemberCount: groupsDict[flag.group_id]?.memberCount,
        targetImageUrl: groupsDict[flag.group_id]?.imageUrl || "",
        reason,
        additionalNotes,
        evidenceUrl: flag.evidence_url || "",
        status: flag.status || "pending",
        createdAt: flag.created_at,
      };
    });

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


