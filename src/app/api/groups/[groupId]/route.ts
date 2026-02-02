import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

const ISO_DATE_REGEX = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId } = await params;

  const { data, error } = await supabase
    .from("groups")
    .select(
      "id, name, destination, cover_image, description, notes, start_date, end_date, is_public, status, creator_id"
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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const body = await req.json();
  const {
    name,
    destination,
    description,
    cover_image,
    notes,
    start_date,
    end_date,
    is_public,
  } = body;

  // Validate user and membership
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (userError || !userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if group exists and get creator
  const { data: groupCheck, error: groupCheckError } = await supabase
    .from("groups")
    .select("id, status, creator_id")
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

  // Only creator or admin can update
  const { data: membership } = await supabase
    .from("group_memberships")
    .select("role")
    .eq("group_id", groupId)
    .eq("user_id", userRow.id)
    .eq("status", "accepted")
    .single();

  const isCreator = groupCheck.creator_id === userRow.id;
  const isAdmin = membership?.role === "admin";
  if (!isCreator && !isAdmin) {
    return NextResponse.json(
      { error: "Only group creator or admin can update group" },
      { status: 403 }
    );
  }

  // Build update object with only provided fields
  const updates: Record<string, unknown> = {};
  if (name !== undefined) {
    if (typeof name !== "string" || name.length < 3 || name.length > 50) {
      return NextResponse.json(
        { error: "Group name must be 3-50 characters" },
        { status: 400 }
      );
    }
    updates.name = name;
  }
  if (destination !== undefined) {
    if (typeof destination !== "string" || destination.trim().length < 1) {
      return NextResponse.json(
        { error: "Destination is required" },
        { status: 400 }
      );
    }
    updates.destination = destination;
  }
  if (description !== undefined) {
    if (typeof description !== "string") {
      updates.description = null;
    } else {
      updates.description = description.length > 0 ? description : null;
    }
  }
  if (cover_image !== undefined) {
    updates.cover_image =
      typeof cover_image === "string" && cover_image.length > 0
        ? cover_image
        : null;
  }
  if (notes !== undefined) {
    if (typeof notes !== "string") {
      return NextResponse.json(
        { error: "Invalid notes value" },
        { status: 400 }
      );
    }
    updates.notes = notes;
  }

  if (is_public !== undefined) {
    if (typeof is_public !== "boolean") {
      return NextResponse.json(
        { error: "Invalid is_public value" },
        { status: 400 }
      );
    }
    updates.is_public = is_public;
  }

  const hasStartDate = start_date !== undefined;
  const hasEndDate = end_date !== undefined;
  if (hasStartDate || hasEndDate) {
    if (typeof start_date !== "string" || typeof end_date !== "string") {
      return NextResponse.json(
        { error: "Both start_date and end_date must be provided" },
        { status: 400 }
      );
    }

    if (!ISO_DATE_REGEX.test(start_date) || !ISO_DATE_REGEX.test(end_date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (start_date >= end_date) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    updates.start_date = start_date;
    updates.end_date = end_date;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      {
        status: 400,
      }
    );
  }

  const { data, error } = await supabase
    .from("groups")
    .update(updates)
    .eq("id", groupId)
    .select(
      "id, name, destination, cover_image, description, notes, start_date, end_date, is_public, status"
    )
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(data);
}
