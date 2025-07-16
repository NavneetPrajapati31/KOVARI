import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerSupabaseClient();
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

  const { data, error } = await supabase
    .from("itinerary_items")
    .select(
      "id, group_id, title, description, datetime, type, status, location, priority, notes, assigned_to, image_url, external_link, created_at, is_archived"
    )
    .eq("group_id", groupId)
    .order("datetime", { ascending: true });

  console.log("Fetched itinerary data:", data);

  if (error) {
    console.log("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
