import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const supabase = createRouteHandlerSupabaseClient();

    // Get user's internal ID
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .eq("isDeleted", false)
      .single();

    if (userError || !userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if group exists and is not removed
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, status, creator_id")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Block access to removed groups
    if (group.status === "removed") {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Block access to pending groups for non-creators
    if (group.status === "pending" && group.creator_id !== userRow.id) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from("group_memberships")
      .select("status")
      .eq("group_id", groupId)
      .eq("user_id", userRow.id)
      .eq("status", "accepted")
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 }
      );
    }

    // Fetch group members with profile information
    const { data: members, error: membersError } = await supabase
      .from("group_memberships")
      .select(
        `
        role,
        joined_at,
        user_id,
        users(
          id,
          clerk_user_id,
          profiles(
            name,
            username,
            profile_photo,
            deleted
          )
        )
      `
      )
      .eq("group_id", groupId)
      .eq("status", "accepted")
      .order("joined_at", { ascending: true });

    // Debug: log the raw members data
    console.log("[API][members route] Raw members data:", members);

    if (membersError) {
      console.error("Error fetching members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    // Transform members data (return both user_id and users.id for debugging)
    const formattedMembers =
      members?.map((member: any) => {
        const profile = member.users?.profiles;
        const isDeleted = profile?.deleted === true;

        return {
          id: member.user_id, // from group_memberships
          userIdFromUserTable: member.users?.id, // from users table
          clerkId: member.users?.clerk_user_id, // Clerk user id
          name: isDeleted ? "Deleted User" : profile?.name || "Unknown User",
          username: isDeleted ? undefined : profile?.username,
          avatar: isDeleted ? undefined : profile?.profile_photo,
          role: member.role,
          joined_at: member.joined_at,
        };
      }) || [];
    return NextResponse.json({ members: formattedMembers });
  } catch (error) {
    console.error("[GET_MEMBERS]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const supabase = createRouteHandlerSupabaseClient();

    // Parse request body
    let memberId: string | undefined;
    let memberClerkId: string | undefined;
    try {
      const body = await req.json();
      memberId = body.memberId;
      memberClerkId = body.memberClerkId;
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    if (!memberId || !memberClerkId) {
      return NextResponse.json(
        { error: "memberId and memberClerkId are required" },
        { status: 400 }
      );
    }

    // Prevent self-removal
    if (memberClerkId === currentUserId) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the group" },
        { status: 403 }
      );
    }

    // Get current user's internal ID
    const { data: currentUserRow, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", currentUserId)
      .single();

    if (currentUserError || !currentUserRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get target user's internal ID
    const { data: targetUserRow, error: targetUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", memberClerkId)
      .single();

    if (targetUserError || !targetUserRow) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // Verify target user is actually a member of the group
    const { data: targetMembership, error: targetMembershipError } =
      await supabase
        .from("group_memberships")
        .select("status, role")
        .eq("group_id", groupId)
        .eq("user_id", targetUserRow.id)
        .eq("status", "accepted")
        .single();

    if (targetMembershipError || !targetMembership) {
      return NextResponse.json(
        { error: "User is not a member of this group" },
        { status: 404 }
      );
    }

    // Check if current user is a member of the group
    const { data: currentMembership, error: currentMembershipError } =
      await supabase
        .from("group_memberships")
        .select("role")
        .eq("group_id", groupId)
        .eq("user_id", currentUserRow.id)
        .eq("status", "accepted")
        .single();

    if (currentMembershipError || !currentMembership) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 }
      );
    }

    // Check if current user is admin or the group creator
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("creator_id, status")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Block access to removed groups
    if (group.status === "removed") {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const isAdmin = currentMembership.role === "admin";
    const isCreator = group.creator_id === currentUserRow.id;

    // Only admins or the group creator can remove members
    if (!isAdmin && !isCreator) {
      return NextResponse.json(
        { error: "Only admins or group creator can remove members" },
        { status: 403 }
      );
    }

    // Prevent removing the group creator (they should leave the group instead)
    if (group.creator_id === targetUserRow.id) {
      return NextResponse.json(
        {
          error:
            "Cannot remove the group creator. They must leave the group themselves.",
        },
        { status: 403 }
      );
    }

    // Remove the member from group_memberships
    const { error: deleteError } = await supabase
      .from("group_memberships")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", targetUserRow.id);

    if (deleteError) {
      console.error("Error removing member:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove member" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE_MEMBER]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
