import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; itemId: string }> }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId, itemId } = await params;
  const { data, error } = await supabase
    .from("itinerary_items")
    .select("*")
    .eq("id", itemId)
    .eq("group_id", groupId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; itemId: string }> }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId, itemId } = await params;
  const body = await req.json();

  // Debug: log the incoming body
  console.log("API update payload:", body);

  // Validation
  const allowedTypes = [
    "flight",
    "accommodation",
    "activity",
    "transport",
    "budget",
    "other",
  ];
  const allowedStatus = ["confirmed", "pending", "cancelled", "completed"];
  const allowedPriority = ["high", "medium", "low"];

  if (!body.title || !body.datetime || !body.type) {
    return NextResponse.json(
      { error: "Missing required fields (title, datetime, type)" },
      { status: 400 }
    );
  }
  if (!allowedTypes.includes(body.type)) {
    return NextResponse.json(
      { error: `Invalid type: ${body.type}` },
      { status: 400 }
    );
  }
  if (body.status && !allowedStatus.includes(body.status)) {
    return NextResponse.json(
      { error: `Invalid status: ${body.status}` },
      { status: 400 }
    );
  }
  if (body.priority && !allowedPriority.includes(body.priority)) {
    return NextResponse.json(
      { error: `Invalid priority: ${body.priority}` },
      { status: 400 }
    );
  }

  // Remove id/group_id from body to avoid accidental overwrite
  delete body.id;
  delete body.group_id;

  const { data, error } = await supabase
    .from("itinerary_items")
    .update({ ...body })
    .eq("id", itemId)
    .eq("group_id", groupId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; itemId: string }> }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId, itemId } = await params;
  const { error } = await supabase
    .from("itinerary_items")
    .delete()
    .eq("id", itemId)
    .eq("group_id", groupId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
