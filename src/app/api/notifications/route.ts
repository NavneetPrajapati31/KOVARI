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

    const { data: notificationsData, error } = await query;

    if (error) {
      console.error("Error fetching notifications:", error);
      return NextResponse.json(
        { error: "Failed to fetch notifications" },
        { status: 500 }
      );
    }

    const notifications = notificationsData || [];

    // Enrichment: Fetch images for notifications
    const userIdsToFetch = new Set<string>();
    const groupIdsToFetch = new Set<string>();

    notifications.forEach((n) => {
      if (!n.entity_id) return;
      
      if (
        n.entity_type === "match" || 
        n.entity_type === "chat"
      ) {
         // for match/chat, entity_id is the user ID
         userIdsToFetch.add(n.entity_id);
      } else if (n.entity_type === "group") {
         groupIdsToFetch.add(n.entity_id);
      }
    });

    // Fetch in parallel
    const [profilesResult, groupsResult] = await Promise.all([
      userIdsToFetch.size > 0
        ? supabase
            .from("profiles")
            .select("user_id, profile_photo")
            .in("user_id", Array.from(userIdsToFetch))
        : Promise.resolve({ data: [] }),
      groupIdsToFetch.size > 0
        ? supabase
            .from("groups")
            .select("id, cover_image")
            .in("id", Array.from(groupIdsToFetch))
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map();
    if (profilesResult.data) {
      profilesResult.data.forEach((p: any) => {
        profileMap.set(p.user_id, p.profile_photo);
      });
    }

    const groupMap = new Map();
    if (groupsResult.data) {
      groupsResult.data.forEach((g: any) => {
        groupMap.set(g.id, g.cover_image);
      });
    }

    // Attach images
    const enrichedNotifications = notifications.map((n) => {
      let image_url;
      if (n.entity_type === "match" || n.entity_type === "chat") {
        image_url = profileMap.get(n.entity_id);
      } else if (n.entity_type === "group") {
        image_url = groupMap.get(n.entity_id);
      }
      return { ...n, image_url };
    });

    return NextResponse.json({ notifications: enrichedNotifications });
  } catch (error: any) {
    console.error("Exception in GET /api/notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
