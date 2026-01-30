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
      "id, title, description, datetime, type, status, location, priority, assigned_to, notes, image_url, external_link"
    )
    .eq("group_id", groupId)
    .order("datetime", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId } = await params;

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, status")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }
  if (group.status === "removed") {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  const body = await req.json();

  const allowedTypes = [
    "flight",
    "accommodation",
    "activity",
    "transport",
    "budget",
    "other",
  ];
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
  if (body.priority && !allowedPriority.includes(body.priority)) {
    return NextResponse.json(
      { error: `Invalid priority: ${body.priority}` },
      { status: 400 }
    );
  }

  const insertPayload = {
    group_id: groupId,
    title: body.title,
    description: body.description ?? null,
    datetime: body.datetime,
    type: body.type,
    status: body.status ?? "pending",
    location: body.location ?? null,
    priority: body.priority ?? "medium",
    notes: body.notes ?? null,
    assigned_to: Array.isArray(body.assigned_to) ? body.assigned_to : [],
    image_url: body.image_url ?? null,
    external_link: body.external_link ?? null,
  };

  const { data, error } = await supabase
    .from("itinerary_items")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json(data);
}
