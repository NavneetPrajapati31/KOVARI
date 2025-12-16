import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId } = await params;

  // Check if group exists and is not removed
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, status, creator_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Block access to removed groups
  if (group.status === "removed") {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Block access to pending groups for non-creators
  if (group.status === "pending") {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Get user's internal ID
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Only allow creator to access pending groups
    if (group.creator_id !== userData.id) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
  }

  const { data, error } = await supabase
    .from("itinerary_items")
    .select(
      "id, title, description, datetime, type, status, location, priority, assigned_to"
    )
    .eq("group_id", groupId)
    .order("datetime", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
