import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

async function resolveTargetUserId(
  supabase: ReturnType<typeof createAdminSupabaseClient>,
  userIdOrClerkId: string,
) {
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId: currentUserId } = await auth();
    const { userId: targetUserId } = await params;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Missing target user ID" },
        { status: 400 },
      );
    }

    const supabase = createAdminSupabaseClient();

    // Get current user's UUID from Clerk userId
    const { data: currentUserRow, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", currentUserId)
      .eq("isDeleted", false)
      .single();

    if (currentUserError || !currentUserRow) {
      console.error("Error finding current user:", currentUserError);
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 },
      );
    }

    // Check if target user exists
    const resolvedTargetUserId = await resolveTargetUserId(
      supabase,
      targetUserId,
    );
    if (!resolvedTargetUserId) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );
    }

    // Prevent self-following
    if (currentUserRow.id === resolvedTargetUserId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 },
      );
    }

    // Check if already following
    const { data: existingFollow, error: followCheckError } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", currentUserRow.id)
      .eq("following_id", resolvedTargetUserId)
      .maybeSingle();

    if (followCheckError) {
      console.error("Error checking follow status:", followCheckError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (existingFollow) {
      // Unfollow: Delete the follow relationship
      const { error: deleteError } = await supabase
        .from("user_follows")
        .delete()
        .eq("follower_id", currentUserRow.id)
        .eq("following_id", resolvedTargetUserId);

      if (deleteError) {
        console.error("Error unfollowing:", deleteError);
        return NextResponse.json(
          { error: "Failed to unfollow" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        action: "unfollowed",
        message: "Successfully unfollowed user",
      });
    } else {
      // Follow: Create the follow relationship
      const { error: insertError } = await supabase
        .from("user_follows")
        .insert({
          follower_id: currentUserRow.id,
          following_id: resolvedTargetUserId,
        });

      if (insertError) {
        console.error("Error following:", insertError);
        return NextResponse.json(
          { error: "Failed to follow user" },
          { status: 500 },
        );
      }

      return NextResponse.json({
        success: true,
        action: "followed",
        message: "Successfully followed user",
      });
    }
  } catch (error) {
    console.error("[FOLLOW_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId: currentUserId } = await auth();
    const { userId: targetUserId } = await params;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "Missing target user ID" },
        { status: 400 },
      );
    }

    const supabase = createAdminSupabaseClient();
    const resolvedTargetUserId = await resolveTargetUserId(
      supabase,
      targetUserId,
    );
    if (!resolvedTargetUserId) {
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 },
      );
    }

    // Get current user's UUID from Clerk userId
    const { data: currentUserRow, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", currentUserId)
      .eq("isDeleted", false)
      .single();

    if (currentUserError || !currentUserRow) {
      console.error("Error finding current user:", currentUserError);
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 },
      );
    }

    // Check if already following
    const { data: existingFollow, error: followCheckError } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", currentUserRow.id)
      .eq("following_id", resolvedTargetUserId)
      .maybeSingle();

    if (followCheckError) {
      console.error("Error checking follow status:", followCheckError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({
      isFollowing: !!existingFollow,
    });
  } catch (error) {
    console.error("[FOLLOW_STATUS_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
