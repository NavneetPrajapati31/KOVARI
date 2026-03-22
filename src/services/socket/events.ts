import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types";
import { pubClient } from "./redis";
import { createAdminSupabaseClient } from "../../lib/supabase-admin";
import { PresenceManager } from "./presence";
import { RateLimiter } from "./rateLimiter";
import { bufferNotification } from "../notifications/batching";

export const registerSocketEvents = (
  io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>,
  socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
) => {
  const userId = socket.data.userId;

  socket.on("join_chat", async ({ chatId }) => {
    socket.join(chatId);
    console.log(`[Socket] User ${userId} joined chat ${chatId}`);
    const supabaseId = socket.data.supabaseId || null;
    PresenceManager.userJoinedChat(userId, chatId, (cId, uId) => {
        socket.to(cId).emit("user_online", { userId: uId, supabaseId });
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
    
    // Override avatar with the Supabase profile_photo cached at connection time
    const enrichedMessage = {
      ...message,
      avatar: (socket.data as any).profilePhoto || message.avatar,
    };

    // Immediately broadcast to all users in the room
    io.to(chatId).emit("receive_message", enrichedMessage);
    
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

      // ========== PHASE 4: NOTIFICATIONS ==========
      // ========== PHASE 4: NOTIFICATIONS ==========
      const senderName = (socket.data as any).fullName || "Someone";
      const senderAvatar = (socket.data as any).profilePhoto || null;
      const isDirectChat = chatId.includes("_");

      if (isDirectChat) {
        // Direct Chat: Recipient is message.receiverId
        const recipientId = message.receiverId;
        if (recipientId) {
          await handleNotificationForUser(io, recipientId, chatId, senderName, senderAvatar, message.text || "Sent a message");
        }
      } else {
        // Group Chat: Get all members except sender
        const supabase = createAdminSupabaseClient();
        const { data: members } = await supabase
          .from("group_memberships")
          .select("user_id")
          .eq("group_id", chatId)
          .eq("status", "accepted")
          .neq("user_id", socket.data.supabaseId); // Use Supabase ID for DB lookup

        if (members) {
          for (const member of members) {
            // Need to map Supabase UUID back to Clerk ID for socket/presence checks
            const { data: userRow } = await supabase
              .from("users")
              .select("clerk_user_id")
              .eq("id", member.user_id)
              .single();
            
            if (userRow?.clerk_user_id) {
              await handleNotificationForUser(io, userRow.clerk_user_id, chatId, senderName, senderAvatar, message.text || "Sent a message to the group");
            }
          }
        }
      }
    } catch (error) {
      console.error("[Socket] Failed to persist message or send notification:", error);
    }
  });

  /**
   * Helper to handle notification logic for a single user
   */
  async function handleNotificationForUser(
    io: Server, 
    targetClerkUserId: string, 
    chatId: string, 
    senderName: string, 
    senderAvatar: string | null,
    text: string
  ) {
    // 1. Check if user is in the active chat room
    const targetSockets = io.sockets.adapter.rooms.get(chatId);
    const userSocketsKey = `user_socket:${targetClerkUserId}`;
    const userSocketIds = await pubClient.sMembers(userSocketsKey);
    
    let isUserInChat = false;
    if (targetSockets && userSocketIds) {
      for (const sId of userSocketIds) {
        if (targetSockets.has(sId)) {
          isUserInChat = true;
          break;
        }
      }
    }

    if (isUserInChat) {
      // User is already looking at the chat, no notification needed
      return;
    }

    // 2. User is NOT in chat. Trigger real-time socket notification if online
    const isOnline = userSocketIds && userSocketIds.length > 0;
    
    if (isOnline) {
      // Emit to user's private room
      io.to(`user_socket:${targetClerkUserId}`).emit("new_notification", {
        type: "NEW_MESSAGE",
        title: `New message from ${senderName}`,
        message: text || "Sent a message",
        chatId,
        image_url: senderAvatar, // Include avatar for UI
        created_at: new Date().toISOString(),
      });
      
      // Also emit unread count update if we want to be fancy
      // io.to(`user_socket:${targetClerkUserId}`).emit("unread_update", { chatId });
    }

    // 3. Trigger Batching/Push for offline OR not-in-chat users
    // (Requirement 3: trigger push if offline, Requirement 4: buffer if not in chat)
    const senderSupabaseId = socket.data.supabaseId || "";
    await bufferNotification(targetClerkUserId, chatId, senderName, senderAvatar || "", text, senderSupabaseId);
  }

  // ========== ADVANCED UX EVENTS ==========

  socket.on("typing_start", ({ chatId }) => {
    socket.to(chatId).emit("user_typing", { chatId, userId });
  });

  socket.on("typing_stop", ({ chatId }) => {
    socket.to(chatId).emit("user_stopped_typing", { chatId, userId });
  });

  socket.on("message_delivered", ({ chatId, messageId }) => {
    // Relay to sender immediately
    socket.to(chatId).emit("message_delivered_ack", { chatId, messageId, userId });
  });

  socket.on("mark_seen", async ({ chatId, messageIds }) => {
    try {
      const supabase = createAdminSupabaseClient();
      const isDirectChat = chatId.includes("_");
      const supabaseId = socket.data.supabaseId;
      
      const table = isDirectChat ? "direct_messages" : "group_messages";
      
      if (messageIds.length > 0) {
        if (isDirectChat) {
          await supabase
            .from(table)
            .update({ read_at: new Date().toISOString() })
            .in("id", messageIds)
            .is("read_at", null);
        } else if (supabaseId) {
          // Group chat: track per-user, per-message progress in Redis for accurate "all members seen" status
          const countKey = `group_member_count:${chatId}`;
          const cachedCount = await pubClient.get(countKey);
          let memberCount = cachedCount ? parseInt(cachedCount) : 0;

          if (!memberCount) {
            const { count } = await supabase
              .from("group_memberships")
              .select("*", { count: "exact", head: true })
              .eq("group_id", chatId)
              .eq("status", "accepted");
            memberCount = count || 0;
            await pubClient.set(countKey, memberCount.toString(), { EX: 300 });
          }

          // Mark each message as seen by THIS user in Redis Sets
          for (const msgId of messageIds) {
             const setKey = `group_msg_seen:${chatId}:${msgId}`;
             await pubClient.sAdd(setKey, supabaseId);
             
             // Check if all members (excluding sender) have now seen it
             const seenCount = await pubClient.sCard(setKey);
             if (seenCount >= memberCount - 1 && memberCount > 1) {
                // BLUE TICK TRIGGER: Emit to the room that this message is now fully seen
                io.to(chatId).emit("messages_seen", { 
                  chatId, 
                  messageIds: [msgId], 
                  userId,
                  isFullySeen: true // This flag triggers the blue check in the UI
                });
                // Once fully seen, we can optionally cleanup the set (after a short delay or now)
                await pubClient.expire(setKey, 3600); // Keep for an hour just in case of race conditions
             }
          }
        }
      }
      
      // Individual feedback (grey ticks still, but tells sender SOMEONE saw it)
      socket.to(chatId).emit("messages_seen", { chatId, messageIds, userId });
    } catch (error) {
       console.error("[Socket] Failed to mark messages seen:", error);
    }
  });

  socket.on("get_last_seen", async ({ userId: targetUserId }, callback) => {
    try {
      const supabase = createAdminSupabaseClient();
      const { data, error } = await supabase
          .from("users")
          .select("clerk_user_id")
          .eq("id", targetUserId)
          .single();

      if (error || !data?.clerk_user_id) {
         callback(null);
         return;
      }

      const lastSeen = await PresenceManager.getLastSeen(data.clerk_user_id);
      callback(lastSeen);
    } catch (e) {
      console.error("[Socket] Failed to get last seen:", e);
      callback(null);
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
      sender_id: userUuid,
      receiver_id: message.receiverId,
      encrypted_content: message.encryptedContent || null,
      encryption_iv: message.iv || null,
      encryption_salt: message.salt || null,
      media_url: message.mediaUrl || null,
      media_type: message.mediaType || null,
      client_id: message.tempId || null,
      is_encrypted: message.isEncrypted || false,
    }).select("*").single();

    if (error) {
      console.error("[Socket DB Persist] Direct message error:", error);
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
    }).select("id").single();

    if (error) {
      console.error("[Socket] Failed to persist group message:", error);
      throw error;
    }
    return data;
  }
}
