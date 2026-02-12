import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function GET(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const supabase = createAdminSupabaseClient();
  const { searchParams } = new URL(req.url);
  const groupId = searchParams.get("groupId");

  console.log("Requested groupId:", groupId);

  if (!groupId) {
    console.log("No groupId provided");
    return NextResponse.json(
      { error: "Missing groupId parameter" },
      { status: 400 }
    );
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .eq("isDeleted", false)
    .single();
  if (userError || !userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, status, creator_id")
    .eq("id", groupId)
    .single();
  if (groupError || !group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.status === "removed") {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const isCreator = group.creator_id === userRow.id;
  if (group.status === "pending" && !isCreator) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (!isCreator) {
    const { data: membership } = await supabase
      .from("group_memberships")
      .select("status")
      .eq("group_id", groupId)
      .eq("user_id", userRow.id)
      .maybeSingle();
    if (membership?.status !== "accepted") {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 },
      );
    }
  }

  console.log("🔍 Querying itinerary_items table for groupId:", groupId);

  const { data, error } = await supabase
    .from("itinerary_items")
    .select(
      "id, group_id, title, description, datetime, type, status, location, priority, notes, assigned_to, image_url, external_link, created_at, is_archived"
    )
    .eq("group_id", groupId)
    .order("datetime", { ascending: true });

  console.log("📊 Fetched itinerary data:", data);
  console.log("📈 Total items found:", data?.length || 0);

  if (data && data.length > 0) {
    console.log("📝 Sample item:", data[0]);
  }

  if (error) {
    console.log("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
