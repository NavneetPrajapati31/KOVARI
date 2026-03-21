import { pubClient } from "./redis";

/**
 * Enhanced presence tracker with Redis integration for cross-node tracking.
 * Maintains mapping `user_socket:{userId}` -> Set of active socket IDs.
 * Maintains mapping `user_chats:{userId}` -> Set of active chatIds for scoped presence emissions.
 */
export class PresenceManager {
  /**
   * Called when a user's socket connects
   */
  static async userConnected(userId: string, socketId: string) {
    if (!userId) return;
    try {
      const key = `user_socket:${userId}`;
      await pubClient.sAdd(key, socketId);
    } catch (err) {
      console.error("[Presence] Error syncing user connection:", err);
    }
  }

  /**
   * Called when a user maps dynamically to a chat interface. Scopes presence.
   */
  static async userJoinedChat(userId: string, chatId: string, emitOnlineToChat: (cId: string, uId: string) => void) {
      if (!userId || !chatId) return;
      try {
          const chatsKey = `user_chats:${userId}`;
          await pubClient.sAdd(chatsKey, chatId);
          
          // Emit strictly to this chat indicating the user is present in it
          emitOnlineToChat(chatId, userId);
      } catch (err) {}
  }

  /**
   * Called when a user gracefully unmounts a chat interface.
   */
  static async userLeftChat(userId: string, chatId: string) {
      if (!userId || !chatId) return;
      try {
          const chatsKey = `user_chats:${userId}`;
          await pubClient.sRem(chatsKey, chatId);
      } catch (err) {}
  }

  /**
   * Called when a user's socket disconnects with grace-delay race-condition safety
   */
  static async userDisconnected(userId: string, socketId: string, emitOfflineToChat: (cId: string, uId: string, lastSeen: string) => void) {
    if (!userId) return;
    try {
      const socketKey = `user_socket:${userId}`;
      await pubClient.sRem(socketKey, socketId);
      
      const count = await pubClient.sCard(socketKey);
      
      // If count hits exactly 0, trigger grace delay before flushing state globally
      if (count === 0) {
        setTimeout(async () => {
             const newCount = await pubClient.sCard(socketKey);
             if (newCount === 0) {
                 // They are truly offline across all browser tabs and mobile apps.
                 const chatsKey = `user_chats:${userId}`;
                 const activeChats = await pubClient.sMembers(chatsKey);
                                  // Write lastSeen BEFORE emitting so clients can fetch it immediately
                  const nowISO = new Date().toISOString();
                  await pubClient.set(`chat:lastSeen:${userId}`, nowISO);

                  // Clean up presence
                  for (const chatId of activeChats) {
                      emitOfflineToChat(chatId, userId, nowISO);
                  }
                  
                  // Clear their active chats index
                  await pubClient.del(chatsKey);
             }
        }, 1500); // 1.5 second debounced grace period
      }
    } catch (err) {
      console.error("[Presence] Error syncing user disconnection:", err);
    }
  }

  // Fetch last seen timestamp from Redis
  static async getLastSeen(userId: string): Promise<string | null> {
     try {
       const userSocketsKey = `user_socket:${userId}`;
       const count = await pubClient.sCard(userSocketsKey);
       if (count && count > 0) return "online"; // currently online

       const lastSeen = await pubClient.get(`chat:lastSeen:${userId}`);
       return lastSeen || null;
     } catch (e) {
       console.error(`[PresenceManager] Error fetching last seen: ${e}`);
       return null;
     }
  }
  // Flush all stale socket presence data — call once on server startup
  static async flushStalePresence() {
    try {
      const keys = await pubClient.keys("user_socket:*");
      if (keys.length > 0) {
        await pubClient.del(keys);
        console.log(`[Presence] Flushed ${keys.length} stale socket keys on startup`);
      }
      const chatKeys = await pubClient.keys("user_chats:*");
      if (chatKeys.length > 0) {
        await pubClient.del(chatKeys);
      }
    } catch (e) {
      console.error("[Presence] Error flushing stale presence:", e);
    }
  }
}
