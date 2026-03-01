import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

/**
 * GET /api/flags/check
 * Public endpoint for checking if a user has an active report against a target.
 *
 * Query Parameters:
 * ?targetType=user|group
 * &targetId=uuid
 */
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetType = searchParams.get("targetType");
    const targetId = searchParams.get("targetId");

    if (!targetType || !targetId) {
      return NextResponse.json(
        { error: "Missing required fields: targetType, targetId" },
        { status: 400 }
      );
    }

    if (targetType !== "user" && targetType !== "group") {
      return NextResponse.json(
        { error: "targetType must be 'user' or 'group'" },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabaseClient();

    // Get current user's UUID from Clerk userId
    const { data: currentUserRow, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (currentUserError || !currentUserRow) {
      return NextResponse.json(
        { error: "Current user not found" },
        { status: 404 }
      );
    }

    const reporterId = currentUserRow.id;
    let hasActiveReport = false;

    // Check if an active report exists
    if (targetType === "user") {
      const { data, error } = await supabase
        .from("user_flags")
        .select("id")
        .eq("reporter_id", reporterId)
        .eq("user_id", targetId)
        .neq("status", "dismissed")
        .maybeSingle();

      if (!error && data) {
        hasActiveReport = true;
      }
    } else {
      const { data, error } = await supabase
        .from("group_flags")
        .select("id")
        .eq("reporter_id", reporterId)
        .eq("group_id", targetId)
        .neq("status", "dismissed")
        .maybeSingle();

      if (!error && data) {
        hasActiveReport = true;
      }
    }

    return NextResponse.json({ hasActiveReport });
  } catch (error) {
    console.error("Error in GET /api/flags/check:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
