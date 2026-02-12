import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

async function getGroupAccessContext(
  supabase: any,
  groupId: string,
): Promise<
  | {
      ok: true;
      userId: string;
      group: { id: string; status: string; creator_id: string | null };
      isCreator: boolean;
      isAcceptedMember: boolean;
    }
  | { ok: false; status: number; error: string }
> {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .eq("isDeleted", false)
    .single();

  if (userError || !userRow) {
    return { ok: false, status: 404, error: "User not found" };
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, status, creator_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return { ok: false, status: 404, error: "Group not found" };
  }

  if (group.status === "removed") {
    return { ok: false, status: 404, error: "Group not found" };
  }

  const isCreator = group.creator_id === userRow.id;

  // Pending groups are only accessible to creator
  if (group.status === "pending" && !isCreator) {
    return { ok: false, status: 404, error: "Group not found" };
  }

  let isAcceptedMember = false;
  if (!isCreator) {
    const { data: membership } = await supabase
      .from("group_memberships")
      .select("status")
      .eq("group_id", groupId)
      .eq("user_id", userRow.id)
      .maybeSingle();
    isAcceptedMember = membership?.status === "accepted";
    if (!isAcceptedMember) {
      return { ok: false, status: 403, error: "Not a member of this group" };
    }
  } else {
    isAcceptedMember = true;
  }

  return {
    ok: true,
    userId: userRow.id,
    group,
    isCreator,
    isAcceptedMember,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string; itemId: string }> }
) {
  const supabase = createAdminSupabaseClient();
  const { groupId, itemId } = await params;

  const ctx = await getGroupAccessContext(supabase, groupId);
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
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
  const supabase = createAdminSupabaseClient();
  const { groupId, itemId } = await params;

  const ctx = await getGroupAccessContext(supabase, groupId);
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  if (ctx.group.status === "pending") {
    return NextResponse.json(
      { error: "Cannot modify group while it's under review" },
      { status: 403 },
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
  const supabase = createAdminSupabaseClient();
  const { groupId, itemId } = await params;

  const ctx = await getGroupAccessContext(supabase, groupId);
  if (!ctx.ok) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  if (ctx.group.status === "pending") {
    return NextResponse.json(
      { error: "Cannot modify group while it's under review" },
      { status: 403 },
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
