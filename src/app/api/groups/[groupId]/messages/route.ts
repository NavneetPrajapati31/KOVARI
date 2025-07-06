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
        content,
        encrypted_content,
        encryption_iv,
        encryption_salt,
        is_encrypted,
        created_at,
        user_id,
        users(
          id,
          profiles(
            name,
            username,
            profile_photo
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

    // Transform messages to include sender info and format timestamps
    const formattedMessages =
      messages?.map((message: any) => ({
        id: message.id,
        content: message.content,
        encrypted_content: message.encrypted_content,
        encryption_iv: message.encryption_iv,
        encryption_salt: message.encryption_salt,
        is_encrypted: message.is_encrypted,
        timestamp: new Date(message.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        sender: message.users?.profiles?.name || "Unknown User",
        senderUsername: message.users?.profiles?.username,
        avatar: message.users?.profiles?.profile_photo,
        isCurrentUser: message.user_id === userRow.id,
        createdAt: message.created_at,
      })) || [];

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
      content,
      encryptedContent,
      encryptionIv,
      encryptionSalt,
      isEncrypted,
    } = body;

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

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

    let messageData: any = {
      group_id: groupId,
      user_id: userRow.id,
    };

    if (isEncrypted && encryptedContent && encryptionIv && encryptionSalt) {
      // Store encrypted message
      messageData = {
        ...messageData,
        encrypted_content: encryptedContent,
        encryption_iv: encryptionIv,
        encryption_salt: encryptionSalt,
        is_encrypted: true,
        content: null,
      };
    } else {
      // Store plain text message
      messageData = {
        ...messageData,
        content: content.trim(),
        is_encrypted: false,
      };
    }

    // Insert the message
    console.log("Inserting message data:", {
      group_id: messageData.group_id,
      user_id: messageData.user_id,
      has_content: !!messageData.content,
      has_encrypted_content: !!messageData.encrypted_content,
      is_encrypted: messageData.is_encrypted,
    });

    const { data: message, error: insertError } = await supabase
      .from("group_messages")
      .insert(messageData)
      .select(
        `
        id,
        content,
        encrypted_content,
        encryption_iv,
        encryption_salt,
        is_encrypted,
        created_at,
        user_id,
        users(
          id,
          profiles(
            name,
            username,
            profile_photo
          )
        )
      `
      )
      .single();

    if (insertError) {
      console.error("Error inserting message:", insertError);
      console.error("Message data that failed:", messageData);
      return NextResponse.json(
        { error: `Failed to send message: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Format the response
    const formattedMessage = {
      id: message.id,
      content: message.is_encrypted ? null : message.content,
      encryptedContent: message.is_encrypted ? message.encrypted_content : null,
      encryptionIv: message.is_encrypted ? message.encryption_iv : null,
      encryptionSalt: message.is_encrypted ? message.encryption_salt : null,
      isEncrypted: message.is_encrypted || false,
      timestamp: new Date(message.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      sender: (message.users as any)?.profiles?.name || "Unknown User",
      senderUsername: (message.users as any)?.profiles?.username,
      avatar: (message.users as any)?.profiles?.profile_photo,
      isCurrentUser: true,
      createdAt: message.created_at,
    };

    return NextResponse.json(formattedMessage);
  } catch (error) {
    console.error("[POST_MESSAGE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
