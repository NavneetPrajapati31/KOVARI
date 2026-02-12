import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { userId } = await auth();
    const { groupId } = await params;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!groupId) {
      return new NextResponse("Missing groupId", { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // Get user UUID from Clerk userId
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .eq("isDeleted", false)
      .single();

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

    return NextResponse.json({
      isCreator,
      isMember,
      isAdmin,
      hasPendingRequest,
      membership: membership || null,
    });
  } catch (error) {
    console.error("[MEMBERSHIP_GET]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
