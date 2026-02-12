import { NextRequest } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  const supabase = createRouteHandlerSupabaseClient();

  // Get current user (for isFollowing)
  let currentUserId: string | null = null;
  try {
    const { userId: clerkUserId } = await auth();
    if (clerkUserId) {
      const cookieStore = await cookies();
      const serverSupabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: cookieStore }
      );
      const { data: currentUserRow } = await serverSupabase
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
    .eq("following_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const followerIds = follows?.map((f) => f.follower_id) || [];
  if (followerIds.length === 0) {
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get user info for followers
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, profiles(name, username, profile_photo)")
    .in("id", followerIds)
    .eq("isDeleted", false);

  if (usersError) {
    return new Response(JSON.stringify({ error: usersError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
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

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return new Response("Unauthorized", { status: 401 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  );

  // Get current user's internal UUID
  const { data: currentUser } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (!currentUser) return new Response("User not found", { status: 404 });

  // Remove follower relationship (userId is the follower, current user is the following)
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", userId)
    .eq("following_id", currentUser.id);

  if (error) return new Response(error.message, { status: 500 });
  return new Response(null, { status: 204 });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return new Response("Unauthorized", { status: 401 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  );

  // Get current user's internal UUID
  const { data: currentUser, error: currentUserError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (currentUserError) {
    console.error(
      "[POST /followers] Error fetching current user:",
      currentUserError.message
    );
    return new Response(JSON.stringify({ error: currentUserError.message }), {
      status: 500,
    });
  }
  if (!currentUser) {
    console.error(
      "[POST /followers] Current user not found for clerkUserId:",
      clerkUserId
    );
    return new Response(JSON.stringify({ error: "User not found" }), {
      status: 404,
    });
  }

  // Debug log
  console.log("[POST /followers] Attempting to follow:", {
    follower_id: currentUser.id,
    following_id: userId,
  });

  // Add follow relationship (current user follows userId)
  const { error: insertError } = await supabase.from("user_follows").insert({
    follower_id: currentUser.id,
    following_id: userId,
  });

  if (insertError) {
    console.error(
      "[POST /followers] Supabase insert error:",
      insertError.message
    );
    return new Response(JSON.stringify({ error: insertError.message }), {
      status: 500,
    });
  }
  return new Response(null, { status: 201 });
}
