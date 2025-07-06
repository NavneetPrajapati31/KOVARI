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
      .single();

    if (userError || !userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
          profiles(
            name,
            username,
            profile_photo
          )
        )
      `
      )
      .eq("group_id", groupId)
      .eq("status", "accepted")
      .order("joined_at", { ascending: true });

    if (membersError) {
      console.error("Error fetching members:", membersError);
      return NextResponse.json(
        { error: "Failed to fetch members" },
        { status: 500 }
      );
    }

    // Transform members data
    const formattedMembers =
      members?.map((member: any) => ({
        id: member.user_id,
        name: member.users?.profiles?.name || "Unknown User",
        username: member.users?.profiles?.username,
        avatar: member.users?.profiles?.profile_photo,
        role: member.role,
        joined_at: member.joined_at,
      })) || [];
    return NextResponse.json(formattedMembers);
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
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId } = await params;
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
  // Get current user from Clerk
  const { userId: currentUserId } = await auth();
  if (!currentUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (memberClerkId === currentUserId) {
    return NextResponse.json(
      { error: "You cannot remove yourself from the group." },
      { status: 403 }
    );
  }
  // Remove the member from group_memberships
  const { error } = await supabase
    .from("group_memberships")
    .delete()
    .eq("group_id", groupId)
    .eq("user_id", memberId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
