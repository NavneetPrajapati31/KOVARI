import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId } = params;

  const { data, error } = await supabase
    .from("itinerary_items")
    .select(
      "id, title, description, datetime, type, status, location, priority"
    )
    .eq("group_id", groupId)
    .order("datetime", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
