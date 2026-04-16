import { getAuthUserId } from "@/lib/auth/get-user-id";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@kovari/api";
import { generateRequestId } from "@/lib/api/requestId";
import { formatStandardResponse, formatErrorResponse } from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
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
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!groupId) {
      return new NextResponse("Missing groupId", { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // Get user's internal ID based on Clerk ID or direct UUID
    const userQuery = supabase
      .from("users")
      .select("id")
      .eq("isDeleted", false);

    if (userId.startsWith("user_")) {
      userQuery.eq("clerk_user_id", userId);
    } else {
      userQuery.eq("id", userId);
    }

    const { data: user, error: userError } = await userQuery.single();

    if (userError || !user) {
      console.error("Error finding user:", userError);
      return new NextResponse("User not found", { status: 404 });
    }

    // Get group info to check if user is creator and if group is removed
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, creator_id, status")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return new NextResponse("Group not found", { status: 404 });
    }

    // Block access to removed groups
    if (group.status === "removed") {
      return new NextResponse("Group not found", { status: 404 });
    }

    // Block access to pending groups for non-creators
    if (group.status === "pending" && group.creator_id !== user.id) {
      return new NextResponse("Group not found", { status: 404 });
    }

    // Get user's membership info
    const { data: membership, error: membershipError } = await supabase
      .from("group_memberships")
      .select("id, role, status, joined_at")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .maybeSingle();

    const isCreator = group.creator_id === user.id;
    const isMember = membership && membership.status === "accepted";
    const isAdmin = membership && membership.role === "admin";
    const hasPendingRequest =
      membership && membership.status === "pending_request";

    // If not a member, not the creator, and no pending request, return 403
    if (!isMember && !isCreator && !hasPendingRequest) {
      return new NextResponse("Not a member of this group", { status: 403 });
    }

    if (req.headers.get("x-kovari-client") === "mobile") {
      return formatStandardResponse({
        isCreator,
        isMember,
        isAdmin,
        hasPendingRequest,
        membership: membership || null,
      }, {}, { requestId, latencyMs: Date.now() - start });
    }
    return NextResponse.json({
      isCreator,
      isMember,
      isAdmin,
      hasPendingRequest,
      membership: membership || null,
    });
  } catch (error) {
    console.error("[MEMBERSHIP_GET]", error);
    if (req.headers.get("x-kovari-client") === "mobile") {
      return formatErrorResponse("Internal Server Error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
