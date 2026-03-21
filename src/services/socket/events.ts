import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types";
import { createAdminSupabaseClient } from "../../lib/supabase-admin";

export const registerSocketEvents = (
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
  const userId = socket.data.userId;

  socket.on("join_chat", ({ chatId }) => {
    socket.join(chatId);
    console.log(`[Socket] User ${userId} joined chat ${chatId}`);
  });

  socket.on("leave_chat", ({ chatId }) => {
    socket.leave(chatId);
    console.log(`[Socket] User ${userId} left chat ${chatId}`);
  });

  socket.on("send_message", async ({ chatId, message }) => {
    console.log(`[Socket] Message sent to ${chatId} by ${userId}`);
    
    // Immediately broadcast to all users in the room (including sender)
    io.to(chatId).emit("receive_message", message);

    try {
      // Async DB write reusing API logic/principles
      await persistMessageToDb(chatId, message, userId);
    } catch (error) {
      console.error("[Socket] Failed to persist message:", error);
    }
  });
};

/**
 * Persists message to DB
 * This uses the admin client securely on the server-side logic since the socket has already verified the Clerk user ID.
 * It's generalized for both group and direct chat.
 */
async function persistMessageToDb(chatId: string, message: any, clerkUserId: string) {
  const supabase = createAdminSupabaseClient();
  
  // Resolve current user UUID from Clerk userId
  const { data: userRow, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (userError || !userRow) throw new Error("User not found: " + clerkUserId);
  const userUuid = userRow.id;

  // Determine if group chat or direct chat
  const isDirectChat = chatId.includes("_");

  if (isDirectChat) {
    // chatId is derived from sorted UUIDs
    const [uuid1, uuid2] = chatId.split("_");
    const partnerId = uuid1 === userUuid ? uuid2 : uuid1;

    const payload = {
      sender_id: userUuid,
      receiver_id: partnerId,
      encrypted_content: message.encryptedContent || null,
      encryption_iv: message.iv || null,
      encryption_salt: message.salt || null,
      is_encrypted: Boolean(message.isEncrypted),
      media_url: message.mediaUrl || null,
      media_type: message.mediaType || null,
      client_id: message.tempId || undefined,
    };

    const { error } = await supabase.from("direct_messages").insert([payload]);
    if (error) throw new Error("Failed to insert direct message: " + error.message);
  } else {
    // Group chat: chatId is groupId
    const payload = {
      group_id: chatId,
      user_id: userUuid,
      encrypted_content: message.encryptedContent || null,
      encryption_iv: message.iv || null,
      encryption_salt: message.salt || null,
      is_encrypted: Boolean(message.isEncrypted),
      media_url: message.mediaUrl || null,
      media_type: message.mediaType || null,
      // client_id / tempId can also be explicitly saved if group messages table supports client_id
    };

    const { error } = await supabase.from("group_messages").insert([payload]);
    if (error) throw new Error("Failed to insert group message: " + error.message);
  }
}
