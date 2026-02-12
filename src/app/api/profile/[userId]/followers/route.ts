import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

async function resolveUserId(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userIdOrClerkId: string,
) {
  if (!userIdOrClerkId) return null;

  const byUuid = await supabase
    .from("users")
    .select("id")
    .eq("id", userIdOrClerkId)
    .eq("isDeleted", false)
    .maybeSingle();
  if (byUuid.data?.id) return byUuid.data.id;

  const byClerk = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userIdOrClerkId)
    .eq("isDeleted", false)
    .maybeSingle();
  return byClerk.data?.id ?? null;
}

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId: paramUserId } = await context.params;
  const supabase = createAdminSupabaseClient();
  const targetUserId = await resolveUserId(supabase, paramUserId);
  if (!targetUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get current user (for isFollowing)
  let currentUserId: string | null = null;
  try {
    const { userId: clerkUserId } = await auth();
    if (clerkUserId) {
      const { data: currentUserRow } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .eq("isDeleted", false)
        .single();
      currentUserId = currentUserRow?.id || null;
    }
  } catch {}

  // Get followers (users who follow userId)
  const { data: follows, error } = await supabase
    .from("user_follows")
    .select("follower_id, created_at")
    .eq("following_id", targetUserId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const followerIds = follows?.map((f) => f.follower_id) || [];
  if (followerIds.length === 0) {
    return NextResponse.json([]);
  }

  // Get user info for followers
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, profiles(name, username, profile_photo)")
    .in("id", followerIds)
    .eq("isDeleted", false);

  if (usersError) {
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  // Map user id to user object for fast lookup
  const userMap = new Map(users.map((u: any) => [u.id, u]));
  // For each follower, check if current user is following them, and preserve order
  let followingIds: string[] = [];
  if (currentUserId) {
    const { data: followingRows } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", currentUserId);
    followingIds = followingRows?.map((f) => f.following_id) || [];
  }

  const result = followerIds
    .map((id) => userMap.get(id))
    .filter(Boolean)
    .map((u: any) => ({
      id: u.id,
      username: u.profiles?.username || "",
      name: u.profiles?.name || "",
      avatar: u.profiles?.profile_photo || "",
      isFollowing: followingIds.includes(u.id),
    }));

  return NextResponse.json(result);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId: paramUserId } = await context.params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminSupabaseClient();

  // Get current user's internal UUID
  const { data: currentUser } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (!currentUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const targetUserId = await resolveUserId(supabase, paramUserId);
  if (!targetUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Remove follower relationship (userId is the follower, current user is the following)
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", targetUserId)
    .eq("following_id", currentUser.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId: paramUserId } = await context.params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createAdminSupabaseClient();

  // Get current user's internal UUID
  const { data: currentUser, error: currentUserError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (currentUserError) {
    console.error("[POST /followers] Error fetching current user:", currentUserError.message);
    return NextResponse.json({ error: currentUserError.message }, { status: 500 });
  }
  if (!currentUser) {
    console.error("[POST /followers] Current user not found for clerkUserId:", clerkUserId);
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const targetUserId = await resolveUserId(supabase, paramUserId);
  if (!targetUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (targetUserId === currentUser.id) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  // Debug log
  console.log("[POST /followers] Attempting to follow:", {
    follower_id: currentUser.id,
    following_id: targetUserId,
  });

  // Add follow relationship (current user follows userId)
  const { error: insertError } = await supabase.from("user_follows").insert({
    follower_id: currentUser.id,
    following_id: targetUserId,
  });

  if (insertError) {
    console.error(
      "[POST /followers] Supabase insert error:",
      insertError.message
    );
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }
  return new NextResponse(null, { status: 201 });
}
