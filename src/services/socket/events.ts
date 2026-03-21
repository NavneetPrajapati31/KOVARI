import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types";
import { createAdminSupabaseClient } from "../../lib/supabase-admin";
import { PresenceManager } from "./presence";
import { RateLimiter } from "./rateLimiter";

export const registerSocketEvents = (
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
  const userId = socket.data.userId;

  socket.on("join_chat", ({ chatId }) => {
    socket.join(chatId);
    console.log(`[Socket] User ${userId} joined chat ${chatId}`);
    PresenceManager.userJoinedChat(userId, chatId, (cId, uId) => {
        socket.to(cId).emit("user_online", { userId: uId });
    });
  });

  socket.on("leave_chat", ({ chatId }) => {
    socket.leave(chatId);
    console.log(`[Socket] User ${userId} left chat ${chatId}`);
    PresenceManager.userLeftChat(userId, chatId);
  });

  socket.on("send_message", async ({ chatId, message }, callback) => {
    // Level 0: Basic spam protection
    const isAllowed = await RateLimiter.checkRateLimit(userId, 15, 5); // Max 15 messages per 5s
    if (!isAllowed) {
        if (callback) callback({ status: "error", error: "Rate limit exceeded globally" });
        return;
    }

    console.log(`[Socket] Message sent to ${chatId} by ${userId}`);
    
    // Immediately broadcast to all users in the room
    io.to(chatId).emit("receive_message", message);
    
    // Level 1: DELIVERY ACK
    if (callback) {
       callback({ status: "sent" });
    }

    try {
      // Async DB write reusing API logic/principles
      const persistedMessage = await persistMessageToDb(chatId, message, userId);
      
      // Level 2: PERSISTENCE ACK
      io.to(chatId).emit("message_persisted", {
          tempId: message.tempId || message.id || "",
          messageId: persistedMessage.id,
          chatId
      });
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
    const { data, error } = await supabase.from("direct_messages").insert({
      chat_id: chatId, // Assuming direct messages table has a chat_id column
      sender_id: userUuid,
      encrypted_content: message.encryptedContent || null,
      encryption_iv: message.iv || null,
      encryption_salt: message.salt || null,
      media_url: message.mediaUrl || null,
      media_type: message.mediaType || null,
      is_encrypted: message.isEncrypted ?? true,
      client_id: message.tempId || null, // Add client_id for tempId
    }).select("id").single();

    if (error) {
      console.error("[Socket] Failed to persist direct message:", error);
      throw error;
    }
    return data;
  } else {
    // It's a group chat, the chatId is the groupId
    const { data, error } = await supabase.from("group_messages").insert({
      group_id: chatId,
      user_id: userUuid,
      encrypted_content: message.encryptedContent || null,
      encryption_iv: message.iv || null,
      encryption_salt: message.salt || null,
      media_url: message.mediaUrl || null,
      media_type: message.mediaType || null,
      is_encrypted: message.isEncrypted ?? true,
      client_id: message.tempId || null, // Add client_id for tempId
    }).select("id").single();

    if (error) {
      console.error("[Socket] Failed to persist group message:", error);
      throw error;
    }
    return data;
  }
}
