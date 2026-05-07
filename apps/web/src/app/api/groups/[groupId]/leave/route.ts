import { NextRequest, NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth/get-user-id";
import { createAdminSupabaseClient } from "@kovari/api";
import { generateRequestId } from "@/lib/api/requestId";
import { formatStandardResponse, formatErrorResponse } from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";

export async function POST(
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

    // Get user UUID from Clerk userId
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

    // Check if group exists and is not removed
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, status")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return new NextResponse("Group not found", { status: 404 });
    }

    // Block access to removed groups
    if (group.status === "removed") {
      return new NextResponse("Group not found", { status: 404 });
    }

    // Block leave while pending
    if (group.status === "pending") {
      return NextResponse.json(
        { error: "Cannot modify group while it's under review" },
        { status: 403 },
      );
    }

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from("group_memberships")
      .select("id, role")
      .eq("group_id", groupId)
      .eq("user_id", user.id)
      .eq("status", "accepted")
      .single();

    if (membershipError || !membership) {
      return new NextResponse("You are not a member of this group", {
        status: 404,
      });
    }

    // Check if user is the creator/admin and if there are other members
    if (membership.role === "admin") {
      const { data: otherMembers, error: countError } = await supabase
        .from("group_memberships")
        .select("id")
        .eq("group_id", groupId)
        .eq("status", "accepted")
        .neq("user_id", user.id);

      if (countError) {
        console.error("Error checking other members:", countError);
        return new NextResponse("Database error", { status: 500 });
      }

      if (otherMembers && otherMembers.length > 0) {
        return new NextResponse(
          "Cannot leave group as admin when other members exist. Please transfer admin role or delete the group.",
          { status: 400 }
        );
      }
    }

    // Remove the membership
    const { error: deleteError } = await supabase
      .from("group_memberships")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Error leaving group:", deleteError);
      return new NextResponse("Failed to leave group", { status: 500 });
    }

    // If this was the last member and user was admin, delete the group
    if (membership.role === "admin") {
      const { error: groupDeleteError } = await supabase
        .from("groups")
        .delete()
        .eq("id", groupId);

      if (groupDeleteError) {
        console.error("Error deleting empty group:", groupDeleteError);
        // Don't fail the request if group deletion fails
      }
    }

    if (req.headers.get("x-kovari-client") === "mobile") {
      return formatStandardResponse({ success: true, message: "Successfully left the group" }, {}, { requestId, latencyMs: Date.now() - start });
    }
    return NextResponse.json({
      success: true,
      message: "Successfully left the group",
    });
  } catch (error) {
    console.error("[LEAVE_GROUP_POST]", error);
    if (req.headers.get("x-kovari-client") === "mobile") {
      return formatErrorResponse("Internal Server Error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
