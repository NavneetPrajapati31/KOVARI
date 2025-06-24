import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId } = await params;

  const { data, error } = await supabase
    .from("group_memberships")
    .select(
      "role, joined_at, users!inner(id, clerk_user_id, profiles!inner(name, profile_photo, username))"
    )
    .eq("group_id", groupId)
    .eq("status", "accepted");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "No members found" }, { status: 404 });
  }
  // Flatten and map to expected structure
  const members = data.map((m: any) => ({
    id: m.users.id,
    clerkId: m.users.clerk_user_id,
    name: m.users.profiles.name,
    avatar: m.users.profiles.profile_photo,
    username: m.users.profiles.username,
    role: m.role,
    dateAdded: m.joined_at,
  }));
  return NextResponse.json({ members });
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
  const { userId: currentUserId } = getAuth(req);
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
