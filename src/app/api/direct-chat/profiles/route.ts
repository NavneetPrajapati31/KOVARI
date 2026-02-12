import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const userIds = Array.isArray(body?.userIds)
      ? body.userIds.filter((v: unknown) => typeof v === "string")
      : [];

    if (userIds.length === 0) {
      return NextResponse.json({ profiles: [] });
    }

    const supabase = createAdminSupabaseClient();

    const { data: currentUser, error: currentUserError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .eq("isDeleted", false)
      .single();

    if (currentUserError || !currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure the requester can only ask for users they have chatted with.
    const { data: myMessages, error: messagesError } = await supabase
      .from("direct_messages")
      .select("sender_id, receiver_id")
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`);

    if (messagesError) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const allowedPartnerIds = new Set<string>();
    (myMessages || []).forEach((m) => {
      const partnerId =
        m.sender_id === currentUser.id ? m.receiver_id : m.sender_id;
      if (partnerId) allowedPartnerIds.add(partnerId);
    });

    const safeUserIds = userIds.filter((id: string) => allowedPartnerIds.has(id));
    if (safeUserIds.length === 0) {
      return NextResponse.json({ profiles: [] });
    }

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, username, profile_photo, deleted")
      .in("user_id", safeUserIds);

    if (profilesError) {
      return NextResponse.json({ error: profilesError.message }, { status: 500 });
    }

    return NextResponse.json({ profiles: profiles || [] });
  } catch (error) {
    console.error("[POST /api/direct-chat/profiles] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
