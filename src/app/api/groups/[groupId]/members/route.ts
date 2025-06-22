import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { groupId: string } }
) {
  const supabase = createRouteHandlerSupabaseClient();
  const { groupId } = params;

  const { data, error } = await supabase
    .from("group_memberships")
    .select(
      "role, users!inner(id, profiles!inner(name, profile_photo, username))"
    )
    .eq("group_id", groupId)
    .eq("status", "accepted");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "No members found" }, { status: 404 });
  }
  // Flatten and map to expected structure
  const members = data.map((m: any) => ({
    name: m.users.profiles.name,
    avatar: m.users.profiles.profile_photo,
    username: m.users.profiles.username,
    role: m.role,
  }));
  return NextResponse.json(members);
}
