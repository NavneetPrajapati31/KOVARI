import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId } = params;

  const { data, error } = await supabase
    .from("groups")
    .select(
      "id, name, destination, cover_image, description, notes, start_date, end_date"
    )
    .eq("id", groupId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId } = params;
  const body = await req.json();
  const { notes } = body;
  if (typeof notes !== "string") {
    return NextResponse.json({ error: "Invalid notes value" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("groups")
    .update({ notes })
    .eq("id", groupId)
    .select(
      "id, name, destination, cover_image, description, notes, start_date, end_date"
    )
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
