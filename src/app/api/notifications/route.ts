import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";

/**
 * GET /api/notifications
 * Fetch notifications for the current user
 * Query params:
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 * - unreadOnly: boolean (default: false)
 */
export async function GET(request: Request) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createRouteHandlerSupabaseClient();
    const { searchParams } = new URL(request.url);

    // Get user UUID from Clerk ID
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (userError || !userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = userRow.id;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    // Build query
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    return NextResponse.json({ notifications: data || [] });
  } catch (error: any) {
    console.error("Exception in GET /api/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
