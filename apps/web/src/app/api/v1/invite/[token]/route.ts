import { NextRequest } from "next/server";
import { createAdminSupabaseClient } from "@kovari/api";
import { generateRequestId } from "@/lib/api/requestId";
import { getAuthUserId } from "@/lib/auth/get-user-id";
import {
  formatStandardResponse,
  formatErrorResponse,
} from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const start = Date.now();
  const requestId = generateRequestId();
  const { token } = await params;

  // Optional Auth for membership check
  const clerkUserId = await getAuthUserId(req);

  try {
    const supabase = createAdminSupabaseClient();

    // 1. Resolve token to group
    let groupId: string | null = null;
    
    // Check invite links
    const { data: linkRow } = await supabase
      .from("group_invite_links")
      .select("group_id, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (linkRow) {
      const isExpired = linkRow.expires_at && new Date(linkRow.expires_at).getTime() <= Date.now();
      if (!isExpired) {
        groupId = linkRow.group_id;
      }
    }

    // fallback to email invites if not found
    if (!groupId) {
      const { data: emailRow } = await supabase
        .from("group_email_invitations")
        .select("group_id, status")
        .eq("token", token)
        .maybeSingle();
      if (emailRow && emailRow.status === "pending") {
        groupId = emailRow.group_id;
      }
    }

    if (!groupId) {
      return formatErrorResponse(
        "Invalid or expired invite",
        ApiErrorCode.NOT_FOUND,
        requestId,
        404
      );
    }

    // 2. Fetch group details
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, name, destination, description, cover_image, status, creator_id")
      .eq("id", groupId)
      .single();

    if (groupError || !group || group.status === "removed") {
      return formatErrorResponse(
        "Group no longer exists",
        ApiErrorCode.NOT_FOUND,
        requestId,
        404
      );
    }

    // 3. Fetch social context (member count & avatars)
    const { count: memberCount } = await supabase
      .from("group_memberships")
      .select("id", { count: "exact", head: true })
      .eq("group_id", group.id)
      .eq("status", "accepted");

    const { data: recentMembers } = await supabase
      .from("group_memberships")
      .select("profiles(avatar_url)")
      .eq("group_id", group.id)
      .eq("status", "accepted")
      .limit(3);

    const memberAvatars = (recentMembers || [])
      .map((m: any) => m.profiles?.avatar_url)
      .filter(Boolean);

    console.log(`[Diagnostic] Resolved Group ${group.id}, Creator ${group.creator_id}`);

    // 4. Fetch inviter info (the group creator)
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("name, profile_photo, username")
      .eq("user_id", group.creator_id)
      .maybeSingle();

    // 5. Check if requesting user is already a member (if authenticated)
    let isMember = false;
    if (clerkUserId) {
      const userQuery = supabase.from("users").select("id").eq("isDeleted", false);
      if (clerkUserId.startsWith("user_")) {
        userQuery.eq("clerk_user_id", clerkUserId);
      } else {
        userQuery.eq("id", clerkUserId);
      }
      
      const { data: userRow } = await userQuery.single();
      if (userRow) {
        const { data: membership } = await supabase
          .from("group_memberships")
          .select("status")
          .eq("group_id", groupId)
          .eq("user_id", userRow.id)
          .maybeSingle();
        isMember = membership?.status === "accepted";
      }
    }

    return formatStandardResponse(
      {
        id: group.id,
        name: group.name,
        destination: group.destination,
        description: group.description ?? "Join us to plan our collective journey!",
        coverImage: group.cover_image,
        memberCount: memberCount ?? 0,
        memberAvatars,
        isMember,
        inviter: inviterProfile ? {
          name: inviterProfile.name || inviterProfile.username || "A Traveler",
          avatar: inviterProfile.profile_photo,
          username: inviterProfile.username,
        } : null,
      },
      {},
      { requestId, latencyMs: Date.now() - start }
    );
  } catch (error) {
    console.error("Error fetching invite info:", error);
    return formatErrorResponse(
      "Internal server error",
      ApiErrorCode.INTERNAL_SERVER_ERROR,
      requestId,
      500
    );
  }
}
