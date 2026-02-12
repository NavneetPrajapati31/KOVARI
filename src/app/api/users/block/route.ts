
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetId, action } = await request.json();

    if (!targetId || !action) {
      return NextResponse.json(
        { error: "Missing targetId or action" },
        { status: 400 }
      );
    }

    if (action !== "block" && action !== "unblock") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'block' or 'unblock'" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Get current user's internal ID
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (userError || !userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUserId = userRow.id;

    if (action === "block") {
      // Check if already blocked to avoid unique constraint error
      const { data: existingBlock } = await supabase
        .from("blocked_users")
        .select("id")
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", targetId)
        .maybeSingle();

      if (!existingBlock) {
        const { error: blockError } = await supabase
          .from("blocked_users")
          .insert({
            blocker_id: currentUserId,
            blocked_id: targetId,
          });

        if (blockError) {
          console.error("Error blocking user:", blockError);
          return NextResponse.json(
            { error: "Failed to block user" },
            { status: 500 }
          );
        }
      }
    } else {
      // Unblock
      const { error: unblockError } = await supabase
        .from("blocked_users")
        .delete()
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", targetId);

      if (unblockError) {
        console.error("Error unblocking user:", unblockError);
        return NextResponse.json(
          { error: "Failed to unblock user" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`[POST /api/users/block] error`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get("targetId");

    if (!targetId) {
      return NextResponse.json(
        { error: "Missing targetId" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Get current user's internal ID
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (userError || !userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentUserId = userRow.id;

    const [
      { data: iBlockedThem },
      { data: theyBlockedMe },
    ] = await Promise.all([
      // Check if I blocked them
      supabase
        .from("blocked_users")
        .select("id")
        .eq("blocker_id", currentUserId)
        .eq("blocked_id", targetId)
        .maybeSingle(),
      // Check if they blocked me
      supabase
        .from("blocked_users")
        .select("id")
        .eq("blocker_id", targetId)
        .eq("blocked_id", currentUserId)
        .maybeSingle(),
    ]);

    return NextResponse.json({
      iBlockedThem: !!iBlockedThem,
      theyBlockedMe: !!theyBlockedMe,
    });
  } catch (error) {
    console.error(`[GET /api/users/block] error`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
