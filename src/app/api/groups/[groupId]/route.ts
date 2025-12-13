import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId } = await params;

  const { data, error } = await supabase
    .from("groups")
    .select(
      "id, name, destination, cover_image, description, notes, start_date, end_date, status, creator_id"
    )
    .eq("id", groupId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Block access to removed groups
  if (data.status === "removed") {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Block access to pending groups for non-creators
  if (data.status === "pending") {
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
    if (data.creator_id !== userData.id) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId } = await params;
  const body = await req.json();
  const { notes } = body;
  if (typeof notes !== "string") {
    return NextResponse.json({ error: "Invalid notes value" }, { status: 400 });
  }

  // Check if group exists and is not pending/removed
  const { data: groupCheck, error: groupCheckError } = await supabase
    .from("groups")
    .select("id, status")
    .eq("id", groupId)
    .single();

  if (groupCheckError || !groupCheck) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Block updates to removed groups
  if (groupCheck.status === "removed") {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  // Block updates to pending groups (even for creators)
  if (groupCheck.status === "pending") {
    return NextResponse.json(
      { error: "Cannot update group while it's under review" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("groups")
    .update({ notes })
    .eq("id", groupId)
    .select(
      "id, name, destination, cover_image, description, notes, start_date, end_date, status"
    )
    .single();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
