import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@kovari/api";
import { getUserFromRequest } from "@/lib/auth/middleware";

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

  // Check if current user is the owner of this profile
  let currentUserId: string | null = null;
  const userContext = await getUserFromRequest(req as any);
  if (userContext) {
    currentUserId = userContext.id;
  } else {
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
  }

  if (currentUserId !== targetUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

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
    return NextResponse.json({
      success: true,
      data: [],
    });
  }

  // Get user info for followers with a join to profiles
  // Note: Using "isDeleted" because it's quoted in the schema (case-sensitive)
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select('id, name, profiles!profiles_user_id_fkey(name, username, profile_photo)')
    .in("id", followerIds)
    .eq("isDeleted", false);

  if (usersError) {
    console.error("[GET /followers] Error fetching users:", usersError.message);
    return NextResponse.json({ error: usersError.message }, { status: 500 });
  }

  // Map user id to result object
  const userMap = new Map(users.map((u: any) => {
    // profiles might be an object (1-to-1) or an array
    const profile = Array.isArray(u.profiles) ? u.profiles[0] : u.profiles;
    
    return [u.id, {
      id: u.id,
      username: profile?.username || "user",
      name: profile?.name || u.name || "Kovari User",
      avatar: profile?.profile_photo || "",
    }];
  }));

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
    .map((id) => {
      const userData = userMap.get(id);
      if (!userData) return null;
      return {
        ...userData,
        isFollowing: followingIds.includes(id),
      };
    })
    .filter(Boolean);

  return NextResponse.json({
    success: true,
    data: result,
  });
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId: paramUserId } = await context.params;
  const supabase = createAdminSupabaseClient();
  let currentUserId: string | null = null;

  // 1. Try Mobile JWT Auth
  const userContext = await getUserFromRequest(req as any);
  if (userContext) {
    currentUserId = userContext.id;
  } else {
    // 2. Fallback to Clerk Auth (Web)
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
  }

  if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetUserId = await resolveUserId(supabase, paramUserId);
  if (!targetUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Remove follower relationship (userId is the follower, current user is the following)
  const { error } = await supabase
    .from("user_follows")
    .delete()
    .eq("follower_id", targetUserId)
    .eq("following_id", currentUserId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId: paramUserId } = await context.params;
  const supabase = createAdminSupabaseClient();
  let currentUserId: string | null = null;

  // 1. Try Mobile JWT Auth
  const userContext = await getUserFromRequest(req as any);
  if (userContext) {
    currentUserId = userContext.id;
  } else {
    // 2. Fallback to Clerk Auth (Web)
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
  }

  if (!currentUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const targetUserId = await resolveUserId(supabase, paramUserId);
  if (!targetUserId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (targetUserId === currentUserId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  // Debug log
  console.log("[POST /followers] Attempting to follow:", {
    follower_id: currentUserId,
    following_id: targetUserId,
  });

  // Add follow relationship (current user follows userId)
  const { error: insertError } = await supabase.from("user_follows").insert({
    follower_id: currentUserId,
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
