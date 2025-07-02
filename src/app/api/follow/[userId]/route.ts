import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Get current user's UUID from Clerk userId
    const { data: currentUserRow, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", currentUserId)
      .single();

    if (currentUserError || !currentUserRow) {
      console.error("Error finding current user:", currentUserError);
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    // Check if target user exists
    const { data: targetUserRow, error: targetUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", targetUserId)
      .single();

    if (targetUserError || !targetUserRow) {
      console.error("Error finding target user:", targetUserError);
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }

    // Prevent self-following
    if (currentUserRow.id === targetUserId) {
      return NextResponse.json(
        { error: "Cannot follow yourself" },
        { status: 400 }
      );
    }

    // Check if already following
    const { data: existingFollow, error: followCheckError } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", currentUserRow.id)
      .eq("following_id", targetUserId)
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
        .eq("following_id", targetUserId);

      if (deleteError) {
        console.error("Error unfollowing:", deleteError);
        return NextResponse.json(
          { error: "Failed to unfollow" },
          { status: 500 }
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
          following_id: targetUserId,
        });

      if (insertError) {
        console.error("Error following:", insertError);
        return NextResponse.json(
          { error: "Failed to follow user" },
          { status: 500 }
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
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name) => {
            const cookie = cookieStore.get(name);
            return cookie?.value;
          },
          set: (name, value, options) => {
            cookieStore.set(name, value, options);
          },
          remove: (name, options) => {
            cookieStore.delete(name);
          },
        },
      }
    );

    // Get current user's UUID from Clerk userId
    const { data: currentUserRow, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", currentUserId)
      .single();

    if (currentUserError || !currentUserRow) {
      console.error("Error finding current user:", currentUserError);
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    // Check if already following
    const { data: existingFollow, error: followCheckError } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", currentUserRow.id)
      .eq("following_id", targetUserId)
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
      { status: 500 }
    );
  }
}
