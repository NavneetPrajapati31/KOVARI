import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth/get-user-id";
import { createAdminSupabaseClient } from "@kovari/api";
import { generateRequestId } from "@/lib/api/requestId";
import { formatStandardResponse, formatErrorResponse } from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> },
) {
  const start = Date.now();
  const requestId = generateRequestId();

  try {
    const userId = await getAuthUserId(req);
    const { groupId } = await params;

    if (!userId) {
      if (req.headers.get("x-kovari-client") === "mobile") {
        return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);
      }
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!groupId) {
      return NextResponse.json({ error: "Missing groupId" }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // Resolve acting user (internal uuid)
    const actingUserQuery = supabase
      .from("users")
      .select("id")
      .eq("isDeleted", false);

    if (userId.startsWith("user_")) {
      actingUserQuery.eq("clerk_user_id", userId);
    } else {
      actingUserQuery.eq("id", userId);
    }

    const { data: actingUser, error: actingUserError } = await actingUserQuery.single();

    if (actingUserError || !actingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const targetClerkUserId: string =
      typeof body?.userId === "string" && body.userId.length > 0
        ? body.userId
        : userId;
    const viaInvite = body?.viaInvite === true;
    const approvingOther = targetClerkUserId !== userId;

    // Validate group exists and access rules
    const { data: groupRow, error: groupErr } = await supabase
      .from("groups")
      .select("id, status, creator_id, name")
      .eq("id", groupId)
      .single();
    if (groupErr || !groupRow) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (groupRow.status === "removed") {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    if (groupRow.status === "pending") {
      return NextResponse.json(
        { error: "Cannot modify group while it's under review" },
        { status: 403 },
      );
    }

    const isCreator = groupRow.creator_id === actingUser.id;

    const { data: actingMembership, error: actingMembershipError } =
      await supabase
        .from("group_memberships")
        .select("role, status")
        .eq("group_id", groupId)
        .eq("user_id", actingUser.id)
        .maybeSingle();

    if (actingMembershipError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const isAdmin =
      actingMembership?.status === "accepted" &&
      actingMembership?.role === "admin";

    if (approvingOther && !isCreator && !isAdmin) {
      return NextResponse.json(
        { error: "Only admins can approve join requests" },
        { status: 403 },
      );
    }

    // Get target user (internal uuid)
    const targetUserQuery = supabase
      .from("users")
      .select("id")
      .eq("isDeleted", false);

    if (targetClerkUserId.startsWith("user_")) {
      targetUserQuery.eq("clerk_user_id", targetClerkUserId);
    } else {
      targetUserQuery.eq("id", targetClerkUserId);
    }

    const { data: user, error: userError } = await targetUserQuery.single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If approving a request (not invite flow), ensure a pending_request exists
    if (approvingOther && !viaInvite) {
      const { data: pendingReq, error: pendingErr } = await supabase
        .from("group_memberships")
        .select("id")
        .eq("group_id", groupId)
        .eq("user_id", user.id)
        .eq("status", "pending_request")
        .maybeSingle();
      if (pendingErr) {
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }
      if (!pendingReq) {
        return NextResponse.json(
          { error: "No pending join request found" },
          { status: 404 },
        );
      }
    }
    const { count, error: countErr } = await supabase
      .from("group_memberships")
      .select("id", { count: "exact", head: true })
      .eq("group_id", groupId)
      .eq("status", "accepted");
    if (!countErr && count != null && count >= 10) {
      return NextResponse.json(
        { error: "Group is full (maximum 10 members)" },
        { status: 400 },
      );
    }

    const { error: upsertError } = await supabase
      .from("group_memberships")
      .upsert(
        {
          group_id: groupId,
          user_id: user.id,
          status: "accepted",
          role: "member",
          joined_at: new Date().toISOString(),
        },
        { onConflict: "group_id, user_id" },
      );

    if (upsertError) {
      console.error("Error joining group:", upsertError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Send notification only when this is an admin approving a request (not invite flow)
    if (approvingOther && !viaInvite) {
      try {
        const groupName = groupRow?.name || "a group";

        const { createNotification } = await import(
          "@/lib/notifications/createNotification"
        );
        const { NotificationType } = await import(
          "@kovari/types"
        );

        await createNotification({
          userId: user.id,
          type: NotificationType.GROUP_JOIN_APPROVED,
          title: "Request Approved",
          message: `Your request to join ${groupName} has been approve d.`,
          entityType: "group",
          entityId: groupId,
        });
      } catch (notifyError) {
        console.error(
          "[GROUP_JOIN_POST] Error sending notification:",
          notifyError,
        );
      }
    }

    // --- Recalculate Dominant Languages ---
    try {
      // 1. Get all accepted members
      const { data: members, error: membersError } = await supabase
        .from("group_memberships")
        .select("user_id")
        .eq("group_id", groupId)
        .eq("status", "accepted");

      if (!membersError && members && members.length > 0) {
        const memberIds = members.map(m => m.user_id);
        
        // 2. Fetch languages for all members
        const { data: profiles, error: profilesError } = await supabase
          .from("profiles")
          .select("languages")
          .in("user_id", memberIds);
        
        if (!profilesError && profiles) {
          // 3. Count language occurrences
          const languageCounts: Record<string, number> = {};
          profiles.forEach(p => {
             if (Array.isArray(p.languages)) {
                p.languages.forEach((lang: string) => {
                   languageCounts[lang] = (languageCounts[lang] || 0) + 1;
                });
             }
          });

          // 4. Sort and pick top languages (e.g., top 3)
          const sortedLanguages = Object.entries(languageCounts)
            .sort(([, countA], [, countB]) => countB - countA)
            .slice(0, 3)
            .map(([lang]) => lang);
          
          if (sortedLanguages.length > 0) {
             // 5. Update group
             const { error: updateError } = await supabase
               .from("groups")
               .update({ dominant_languages: sortedLanguages })
               .eq("id", groupId);
             
             if (updateError) {
                console.error("Failed to update group dominant languages:", updateError);
             } else {
                console.log(`Updated group ${groupId} dominant languages to:`, sortedLanguages);
             }
          }
        }
      }
    } catch (calcError) {
      console.error("Error recalculating dominant languages:", calcError);
      // Don't fail the request on calculation error
    }

    if (req.headers.get("x-kovari-client") === "mobile") {
      return formatStandardResponse({ success: true }, {}, { requestId, latencyMs: Date.now() - start });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[GROUP_JOIN_POST]", error);
    if (req.headers.get("x-kovari-client") === "mobile") {
      return formatErrorResponse("Internal Server Error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
