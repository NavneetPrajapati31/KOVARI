import { useEffect, useState, useRef } from "react";
import { decryptMessage } from "@/shared/utils/encryption";
import { useUser } from "@clerk/nextjs";
import { getSocket } from "@/lib/socket";

export interface Conversation {
  userId: string; // UUID
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  lastMediaType?: "image" | "video" | "init";
}

interface UseDirectInboxResult {
  conversations: Conversation[];
  loading: boolean;
  markConversationRead: (userId: string) => void;
}

export const useDirectInbox = (
  currentUserUuid: string,
  activeConversationUserId?: string,
): UseDirectInboxResult => {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  // Track last processed message ID per conversation to avoid double-increment
  const lastProcessedMsgIds = useRef<Record<string, string>>({});

  // Helper: get/set unread from localStorage
  const getUnreadMap = () => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("inboxUnreadMap") || "{}");
    } catch {
      return {};
    }
  };
  const setUnreadMap = (map: Record<string, number>) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("inboxUnreadMap", JSON.stringify(map));
  };

  // Mark conversation as read (set unread to 0)
  const markConversationRead = (userId: string) => {
    const unreadMap = getUnreadMap();
    if (unreadMap[userId]) {
      unreadMap[userId] = 0;
      setUnreadMap(unreadMap);
      setConversations((prev) =>
        prev.map((c) => (c.userId === userId ? { ...c, unreadCount: 0 } : c)),
      );
    }
  };

  // Sync unread counts across tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "inboxUnreadMap") {
        setConversations((prev) => {
          const unreadMap = getUnreadMap();
          return prev.map((c) => ({
            ...c,
            unreadCount: unreadMap[c.userId] || 0,
          }));
        });
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  // Listen for custom event to update recent message in real-time
  useEffect(() => {
    const handler = (e: any) => {
      const { partnerId, message, createdAt, isMe } = e.detail;
      setConversations((prev) => {
        let updated = false;
        const unreadMap = getUnreadMap();
        const next = prev.map((c) => {
          if (c.userId === partnerId && new Date(createdAt) >= new Date(c.lastMessageAt)) {
             updated = true;
             const isRead = isMe || activeConversationUserId === partnerId;
             const newUnread = isRead ? 0 : (c.unreadCount || 0) + 1;
             if (!isRead) {
                unreadMap[partnerId] = newUnread;
                setUnreadMap(unreadMap);
             }
             return { ...c, lastMessage: message, lastMessageAt: createdAt, unreadCount: newUnread };
          }
          return c;
        });
        return updated ? next : prev;
      });
    };
    window.addEventListener("inbox-message-update", handler);
    return () => window.removeEventListener("inbox-message-update", handler);
  }, [activeConversationUserId]);

  // Listen directly to Socket for background events
  useEffect(() => {
    if (!user?.id || !currentUserUuid) return;
    const socket = getSocket(user.id);
    if (!socket.connected) socket.connect();

    const handleReceiveMessage = (incomingMsg: any) => {
       const senderId = incomingMsg.senderId || incomingMsg.sender_id;
       const receiverId = incomingMsg.receiverId || incomingMsg.receiver_id;
       if (!senderId || !receiverId) return;

       const isMe = senderId === currentUserUuid;
       const partnerId = isMe ? receiverId : senderId;
       
       let messageText = incomingMsg.content || incomingMsg.plain_content;
       if (incomingMsg.isEncrypted && !messageText) {
           if (incomingMsg.encryptedContent && incomingMsg.iv && incomingMsg.salt) {
               const sharedSecret = currentUserUuid < partnerId ? `${currentUserUuid}:${partnerId}` : `${partnerId}:${currentUserUuid}`;
               try {
                  messageText = decryptMessage({
                      encryptedContent: incomingMsg.encryptedContent,
                      iv: incomingMsg.iv,
                      salt: incomingMsg.salt
                  }, sharedSecret) || "[Encrypted message]";
               } catch {
                  messageText = "[Failed to decrypt message]";
               }
           } else {
               messageText = "[Encrypted message]";
           }
       }

       if (!isMe) {
          const messageId = incomingMsg.id || incomingMsg.tempId || incomingMsg.client_id;
          if (messageId) {
             const chatId = currentUserUuid < partnerId ? `${currentUserUuid}_${partnerId}` : `${partnerId}_${currentUserUuid}`;
             socket.emit("message_delivered", { chatId, messageId });
          }
       }

       // Dispatch to our CustomEvent loop to reuse the unread tracking logic perfectly
       window.dispatchEvent(
         new CustomEvent("inbox-message-update", {
           detail: {
             partnerId,
             message: messageText,
             createdAt: incomingMsg.createdAt || incomingMsg.created_at || new Date().toISOString(),
             mediaType: incomingMsg.mediaType || incomingMsg.media_type || "",
             isMe
           }
         })
       );
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
       socket.off("receive_message", handleReceiveMessage);
    };
  }, [user?.id, currentUserUuid]);

  useEffect(() => {
    if (!currentUserUuid) {
      setConversations([]);
      setLoading(true);
      return;
    }

    setLoading(true);
    const fetchInbox = async () => {
      try {
        const response = await fetch("/api/direct-chat/inbox", {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) {
          setConversations([]);
          return;
        }
        const payload = await response.json();
        const data = Array.isArray(payload?.messages) ? payload.messages : [];
        // Calculate unread counts from messages if localStorage is missing
        let unreadMap = getUnreadMap();
        let unreadMapChanged = false;
        const map = new Map<string, Conversation>();
        // Track the latest message timestamp per partner
        const latestMsgAt: Record<string, string> = {};
        // Track unread count per partner
        const unreadCountMap: Record<string, number> = {};
        data.forEach((msg: any) => {
          const partnerId =
            msg.sender_id === currentUserUuid ? msg.receiver_id : msg.sender_id;
          if (!partnerId) return;
          // Only count as unread if message is for current user and not from current user and read_at is null
          if (msg.receiver_id === currentUserUuid && !msg.read_at) {
            unreadCountMap[partnerId] = (unreadCountMap[partnerId] || 0) + 1;
          }
          // Track latest message
          if (
            !latestMsgAt[partnerId] ||
            msg.created_at > latestMsgAt[partnerId]
          ) {
            latestMsgAt[partnerId] = msg.created_at;
            // Derive shared secret
            const sharedSecret =
              currentUserUuid < partnerId
                ? `${currentUserUuid}:${partnerId}`
                : `${partnerId}:${currentUserUuid}`;
            let lastMessage = "[Encrypted message]";
            let lastMediaType: "image" | "video" | "init" | undefined =
              undefined;
            if (msg.media_url && msg.media_type) {
              // Media message: show icon/label in inbox
              lastMessage = "";
              lastMediaType = msg.media_type;
            } else if (
              msg.is_encrypted &&
              msg.encrypted_content &&
              msg.encryption_iv &&
              msg.encryption_salt
            ) {
              try {
                lastMessage =
                  decryptMessage(
                    {
                      encryptedContent: msg.encrypted_content,
                      iv: msg.encryption_iv,
                      salt: msg.encryption_salt,
                    },
                    sharedSecret,
                  ) || "[Encrypted message]";
              } catch {
                lastMessage = "[Failed to decrypt message]";
              }
            }
            map.set(partnerId, {
              userId: partnerId,
              lastMessage,
              lastMessageAt: msg.created_at,
              unreadCount: 0, // will set below
              lastMediaType,
            });
          }
        });
        // If localStorage is missing or empty, initialize it from unreadCountMap
        if (Object.keys(unreadMap).length === 0) {
          unreadMap = { ...unreadCountMap };
          unreadMapChanged = true;
        }
        // Set unreadCount for each conversation
        map.forEach((conv, partnerId) => {
          map.set(partnerId, {
            ...conv,
            unreadCount: unreadMap[partnerId] || 0,
          });
        });
        if (unreadMapChanged) setUnreadMap(unreadMap);
        setConversations(Array.from(map.values()));
      } catch {
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchInbox();
    const interval = window.setInterval(fetchInbox, 8000);
    return () => {
      window.clearInterval(interval);
    };
  }, [currentUserUuid, activeConversationUserId]);

  // When activeConversationUserId changes, mark as read
  useEffect(() => {
    if (!activeConversationUserId) return;
    markConversationRead(activeConversationUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationUserId]);

  if (!currentUserUuid) {
    return {
      conversations: [],
      loading: true,
      markConversationRead: () => {},
    };
  }
  return { conversations, loading, markConversationRead };
};
