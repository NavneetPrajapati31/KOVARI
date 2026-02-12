import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

async function resolveCurrentUserId(clerkUserId: string) {
  const supabase = createAdminSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .eq("isDeleted", false)
    .single();
  if (error || !data) return null;
  return data.id as string;
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partnerId = req.nextUrl.searchParams.get("partnerId");
    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
    }

    const offset = Number(req.nextUrl.searchParams.get("offset") || "0");
    const requestedLimit = Number(
      req.nextUrl.searchParams.get("limit") || String(DEFAULT_LIMIT),
    );
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(MAX_LIMIT, requestedLimit))
      : DEFAULT_LIMIT;

    const currentUserId = await resolveCurrentUserId(clerkUserId);
    if (!currentUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabase = createAdminSupabaseClient();
    const orFilter = `and(sender_id.eq.${currentUserId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${currentUserId})`;

    const { data, error } = await supabase
      .from("direct_messages")
      .select(
        `
          *,
          sender:users!direct_messages_sender_id_fkey(
            id,
            profiles(
              name,
              username,
              profile_photo,
              deleted
            )
          )
        `,
      )
      .or(orFilter)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ messages: data || [] });
  } catch (error) {
    console.error("[GET /api/direct-chat/messages] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const partnerId = typeof body?.partnerId === "string" ? body.partnerId : null;
    const clientId = typeof body?.clientId === "string" ? body.clientId : null;

    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
    }

    const currentUserId = await resolveCurrentUserId(clerkUserId);
    if (!currentUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabase = createAdminSupabaseClient();

    const insertPayload = {
      sender_id: currentUserId,
      receiver_id: partnerId,
      encrypted_content:
        typeof body?.encrypted_content === "string" ? body.encrypted_content : null,
      encryption_iv:
        typeof body?.encryption_iv === "string" ? body.encryption_iv : null,
      encryption_salt:
        typeof body?.encryption_salt === "string" ? body.encryption_salt : null,
      is_encrypted: Boolean(body?.is_encrypted),
      client_id: clientId,
      media_url: typeof body?.media_url === "string" ? body.media_url : null,
      media_type:
        body?.media_type === "image" || body?.media_type === "video"
          ? body.media_type
          : null,
    };

    const { data, error } = await supabase
      .from("direct_messages")
      .insert([insertPayload])
      .select(
        `
          *,
          sender:users!direct_messages_sender_id_fkey(
            id,
            profiles(
              name,
              username,
              profile_photo,
              deleted
            )
          )
        `,
      )
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to send message" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/direct-chat/messages] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const partnerId = typeof body?.partnerId === "string" ? body.partnerId : null;
    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
    }

    const currentUserId = await resolveCurrentUserId(clerkUserId);
    if (!currentUserId) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const supabase = createAdminSupabaseClient();
    const { error } = await supabase
      .from("direct_messages")
      .update({ read_at: new Date().toISOString() })
      .eq("receiver_id", currentUserId)
      .eq("sender_id", partnerId)
      .is("read_at", null);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/direct-chat/messages] error", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
