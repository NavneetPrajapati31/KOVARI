import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { getGeminiPlaceOverview } from "@/lib/gemini";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createRouteHandlerSupabaseClient();
  const { groupId } = await params;

  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (userError || !userRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("id, destination, ai_overview, status, creator_id")
    .eq("id", groupId)
    .single();

  if (groupError || !group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.status === "removed") {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.status === "pending" && group.creator_id !== userRow.id) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.status !== "pending") {
    const { data: membership } = await supabase
      .from("group_memberships")
      .select("role")
      .eq("group_id", groupId)
      .eq("user_id", userRow.id)
      .eq("status", "accepted")
      .single();

    if (!membership && group.creator_id !== userRow.id) {
      return NextResponse.json(
        { error: "Not authorized to generate overview" },
        { status: 403 }
      );
    }
  }

  if (group.ai_overview) {
    return NextResponse.json({ ai_overview: group.ai_overview });
  }

  if (!group.destination) {
    return NextResponse.json(
      { error: "Destination is required" },
      { status: 400 }
    );
  }

  const overview = await getGeminiPlaceOverview(group.destination);
  if (!overview) {
    return NextResponse.json(
      { error: "Failed to generate overview" },
      { status: 502 }
    );
  }

  const { error: updateError } = await supabase
    .from("groups")
    .update({ ai_overview: overview })
    .eq("id", groupId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ai_overview: overview });
}
