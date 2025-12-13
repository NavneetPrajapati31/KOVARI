import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

async function checkGroupAccess(
  supabase: any,
  groupId: string,
  requireActive: boolean = false
): Promise<{ allowed: boolean; error?: string }> {
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, status, creator_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return { allowed: false, error: "Group not found" };
  }

  if (group.status === "removed") {
    return { allowed: false, error: "Group not found" };
  }

  if (group.status === "pending") {
    if (requireActive) {
      return {
        allowed: false,
        error: "Cannot modify group while it's under review",
      };
    }
    // For read access, check if user is creator
    const { userId } = await auth();
    if (!userId) {
      return { allowed: false, error: "Group not found" };
    }

    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (userError || !userData || group.creator_id !== userData.id) {
      return { allowed: false, error: "Group not found" };
    }
  }

  return { allowed: true };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; itemId: string }> }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId, itemId } = await params;

  const accessCheck = await checkGroupAccess(supabase, groupId, false);
  if (!accessCheck.allowed) {
    return NextResponse.json(
      { error: accessCheck.error || "Group not found" },
      { status: 404 }
    );
  }

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

  // Block updates if group is pending
  const accessCheck = await checkGroupAccess(supabase, groupId, true);
  if (!accessCheck.allowed) {
    return NextResponse.json(
      {
        error: accessCheck.error || "Cannot update while group is under review",
      },
      { status: accessCheck.error?.includes("not found") ? 404 : 403 }
    );
  }

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

  // Block deletions if group is pending
  const accessCheck = await checkGroupAccess(supabase, groupId, true);
  if (!accessCheck.allowed) {
    return NextResponse.json(
      {
        error: accessCheck.error || "Cannot delete while group is under review",
      },
      { status: accessCheck.error?.includes("not found") ? 404 : 403 }
    );
  }

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
