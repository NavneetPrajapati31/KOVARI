import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@kovari/api";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { assertUUID } from "@/lib/validation/uuid";

const DEFAULT_LIMIT = 30;
const MAX_LIMIT = 100;

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = authUser.id;
    const partnerId = req.nextUrl.searchParams.get("partnerId");
    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
    }

    const cursor = req.nextUrl.searchParams.get("cursor"); // created_at ISO timestamp
    const requestedLimit = Number(
      req.nextUrl.searchParams.get("limit") || String(DEFAULT_LIMIT),
    );
    const limit = Number.isFinite(requestedLimit)
      ? Math.max(1, Math.min(MAX_LIMIT, requestedLimit))
      : DEFAULT_LIMIT;

    const supabase = createAdminSupabaseClient();
    let resolvedPartnerId = partnerId;
    
    // If partnerId looks like a Clerk ID (starts with 'user_'), resolve it to a UUID
    if (partnerId.startsWith('user_')) {
      console.log(`🛡️ [MessagesAPI] Translating Clerk ID ${partnerId} to UUID...`);
      const { data: partnerUser } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", partnerId)
        .single();
      
      if (partnerUser) {
        resolvedPartnerId = partnerUser.id;
        console.log(`🛡️ [MessagesAPI] Resolved to ${resolvedPartnerId}`);
      } else {
        console.warn(`🛡️ [MessagesAPI] Could not resolve Clerk ID ${partnerId}`);
      }
    }

    console.log(`🧪 [MessagesAPI] Fetching history: Me=${currentUserId} | Partner=${resolvedPartnerId}`);

    // SECURITY: Validate UUID format to prevent SQL injection in PostgREST .or() filter
    // Note: PostgREST .or() with interpolated UUIDs is safe because PostgREST treats the value as a data literal, not SQL.
    // However, we enforce UUID validation as a strict defense-in-depth measure.
    try {
      assertUUID(resolvedPartnerId, "partnerId");
      assertUUID(currentUserId, "userId");
    } catch (e: any) {
      return NextResponse.json({ error: e.message }, { status: 400 });
    }

    let query = supabase
      .from("direct_messages")
      .select(`
        *,
        sender:users!direct_messages_sender_id_fkey(
          id,
          clerk_user_id,
          profiles(
            name,
            username,
            profile_photo,
            deleted
          )
        ),
        receiver:users!direct_messages_receiver_id_fkey(
          id,
          clerk_user_id
        )
      `, { count: 'exact' })
      // Capture all messages between Me and Partner
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${resolvedPartnerId}),and(sender_id.eq.${resolvedPartnerId},receiver_id.eq.${currentUserId})`)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error, count, status } = await query;

    console.log(`🧪 [MessagesAPI] Query Result: Status=${status} | Count=${count} | Errors=${error?.message ?? 'None'}`);
    
    if (error) {
      console.error("❌ [MessagesAPI] Supabase Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Resolve Clerk IDs and map to camelCase for mobile
    const flattened = (data || []).map((msg: any) => ({
      ...msg,
      id: msg.id,
      senderId: msg.sender_id,
      receiverId: msg.receiver_id,
      createdAt: msg.created_at,
      encryptedContent: msg.encrypted_content,
      encryptionIv: msg.encryption_iv,
      encryptionSalt: msg.encryption_salt,
      isEncrypted: msg.is_encrypted,
      senderClerkId: msg.sender?.clerk_user_id,
      receiverClerkId: msg.receiver?.clerk_user_id,
    }));

    return NextResponse.json({ messages: flattened });
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
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = authUser.id;
    const body = await req.json().catch(() => ({}));
    const partnerId = typeof body?.partnerId === "string" ? body.partnerId : null;
    const clientId = typeof body?.clientId === "string" ? body.clientId : null;

    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
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
      .select(`
        *,
        sender:users!direct_messages_sender_id_fkey(
          id,
          clerk_user_id,
          profiles(
            name,
            username,
            profile_photo,
            deleted
          )
        ),
        receiver:users!direct_messages_receiver_id_fkey(
          id,
          clerk_user_id
        )
      `)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: error?.message || "Failed to send message" },
        { status: 500 },
      );
    }

    const flattened = {
      ...data,
      sender_clerk_id: (data as any).sender?.clerk_user_id,
      receiver_clerk_id: (data as any).receiver?.clerk_user_id,
    };

    return NextResponse.json({ message: flattened }, { status: 201 });
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
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUserId = authUser.id;
    const body = await req.json().catch(() => ({}));
    const partnerId = typeof body?.partnerId === "string" ? body.partnerId : null;
    if (!partnerId) {
      return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
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
