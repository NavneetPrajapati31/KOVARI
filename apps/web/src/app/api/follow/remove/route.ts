import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@kovari/api";

async function resolveUserId(
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

export async function POST(req: NextRequest) {
  try {
    const { userId: currentUserId } = await auth();

    if (!currentUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { followerId } = body;

    if (!followerId) {
      return NextResponse.json(
        { success: false, error: "Missing followerId" },
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
        { success: false, error: "Current user not found" },
        { status: 404 },
      );
    }

    // Resolve follower ID
    const resolvedFollowerId = await resolveUserId(supabase, followerId);
    
    if (!resolvedFollowerId) {
      return NextResponse.json(
        { success: false, error: "Follower not found" },
        { status: 404 },
      );
    }

    // Delete the follow relationship where they follow current user
    const { error: deleteError } = await supabase
      .from("user_follows")
      .delete()
      .eq("follower_id", resolvedFollowerId)
      .eq("following_id", currentUserRow.id);

    if (deleteError) {
      console.error("Error removing follower:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to remove follower" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully removed follower",
    });
  } catch (error) {
    console.error("[REMOVE_FOLLOWER_ERROR]", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
