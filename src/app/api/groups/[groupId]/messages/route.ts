import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    // REMOVE: limit/offset logic
    const supabase = createRouteHandlerSupabaseClient();

    // Get user's internal ID
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (userError || !userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from("group_memberships")
      .select("status")
      .eq("group_id", groupId)
      .eq("user_id", userRow.id)
      .eq("status", "accepted")
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 }
      );
    }

    // Fetch messages with sender information
    const { data: messages, error: messagesError } = await supabase
      .from("group_messages")
      .select(
        `
        id,
        encrypted_content,
        encryption_iv,
        encryption_salt,
        is_encrypted,
        created_at,
        user_id,
        media_url,
        media_type,
        users(
          id,
          profiles(
            name,
            username,
            profile_photo,
            deleted
          )
        )
      `
      )
      .eq("group_id", groupId)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Error fetching messages:", messagesError);
      return NextResponse.json(
        { error: "Failed to fetch messages" },
        { status: 500 }
      );
    }

    console.log("[GET_MESSAGES] Raw messages from DB:", messages);

    // Transform messages to include sender info and format timestamps
    const formattedMessages =
      messages?.map((message: any) => {
        const profile = message.users?.profiles;
        const isDeleted = profile?.deleted === true;

        return {
          id: message.id,
          encrypted_content: message.encrypted_content,
          encryption_iv: message.encryption_iv,
          encryption_salt: message.encryption_salt,
          is_encrypted: message.is_encrypted,
          timestamp: new Date(message.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          }),
          sender: isDeleted ? "Deleted User" : profile?.name || "Unknown User",
          senderUsername: isDeleted ? undefined : profile?.username,
          senderId: message.user_id ?? message.users?.id,
          avatar: isDeleted ? undefined : profile?.profile_photo,
          isCurrentUser: message.user_id === userRow.id,
          createdAt: message.created_at,
          mediaUrl: message.media_url || undefined,
          mediaType: message.media_type || undefined,
        };
      }) || [];

    console.log("[GET_MESSAGES] Formatted messages:", formattedMessages);

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error("[GET_MESSAGES]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;

    // Read the request body once
    const body = await req.json();
    const {
      encryptedContent,
      encryptionIv,
      encryptionSalt,
      isEncrypted,
      mediaUrl,
      mediaType,
    } = body;

    const supabase = createRouteHandlerSupabaseClient();

    // Get user's internal ID
    const { data: userRow, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (userError || !userRow) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if group exists and is not removed
    const { data: group, error: groupError } = await supabase
      .from("groups")
      .select("id, status")
      .eq("id", groupId)
      .single();

    if (groupError || !group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Block access to removed groups
    if (group.status === "removed") {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Block posting messages to pending groups (even for creators)
    if (group.status === "pending") {
      return NextResponse.json(
        { error: "Cannot send messages while group is under review" },
        { status: 403 }
      );
    }

    // Check if user is a member of the group
    const { data: membership, error: membershipError } = await supabase
      .from("group_memberships")
      .select("status")
      .eq("group_id", groupId)
      .eq("user_id", userRow.id)
      .eq("status", "accepted")
      .single();

    if (membershipError || !membership) {
      return NextResponse.json(
        { error: "Not a member of this group" },
        { status: 403 }
      );
    }

    // Allow: (A) encrypted text message, (B) media-only message, (C) both
    if (
      (isEncrypted && encryptedContent && encryptionIv && encryptionSalt) ||
      (mediaUrl && mediaType)
    ) {
      const messageData: any = {
        group_id: groupId,
        user_id: userRow.id,
        is_encrypted: !!isEncrypted,
      };
      if (isEncrypted) {
        messageData.encrypted_content = encryptedContent;
        messageData.encryption_iv = encryptionIv;
        messageData.encryption_salt = encryptionSalt;
      }
      if (mediaUrl && mediaType) {
        messageData.media_url = mediaUrl;
        messageData.media_type = mediaType;
      }
      console.log("[POST_MESSAGE] Inserting message:", messageData);
      const { data: inserted, error: insertError } = await supabase
        .from("group_messages")
        .insert([messageData])
        .select()
        .single();
      if (insertError) {
        return NextResponse.json(
          { error: "Failed to insert message", details: insertError.message },
          { status: 500 }
        );
      }
      // Return the inserted message (with encrypted and media fields)
      return NextResponse.json({
        id: inserted.id,
        encryptedContent: inserted.encrypted_content,
        encryptionIv: inserted.encryption_iv,
        encryptionSalt: inserted.encryption_salt,
        isEncrypted: inserted.is_encrypted,
        createdAt: inserted.created_at,
        sender: userRow.id,
        mediaUrl: inserted.media_url,
        mediaType: inserted.media_type,
      });
    } else {
      return NextResponse.json(
        {
          error:
            "Only encrypted or media messages are supported. Missing required fields.",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("[POST_MESSAGE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
