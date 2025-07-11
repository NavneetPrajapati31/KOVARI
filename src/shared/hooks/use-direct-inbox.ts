import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { decryptMessage } from "@/shared/utils/encryption";

export interface Conversation {
  userId: string; // UUID
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

interface UseDirectInboxResult {
  conversations: Conversation[];
  loading: boolean;
  markConversationRead: (userId: string) => void;
}

// Add optional activeConversationUserId to track which chat is open
export const useDirectInbox = (
  currentUserUuid: string,
  activeConversationUserId?: string
): UseDirectInboxResult => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const supabase = createClient();
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
        prev.map((c) => (c.userId === userId ? { ...c, unreadCount: 0 } : c))
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
      const { partnerId, message, createdAt } = e.detail;
      setConversations((prev) =>
        prev.map((c) =>
          c.userId === partnerId &&
          new Date(createdAt) > new Date(c.lastMessageAt)
            ? { ...c, lastMessage: message, lastMessageAt: createdAt }
            : c
        )
      );
    };
    window.addEventListener("inbox-message-update", handler);
    return () => window.removeEventListener("inbox-message-update", handler);
  }, []);

  useEffect(() => {
    if (!currentUserUuid) {
      setConversations([]);
      setLoading(true);
      return;
    }
    const fetchInbox = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("direct_messages")
        .select(
          "id, encrypted_content, encryption_iv, encryption_salt, is_encrypted, created_at, sender_id, receiver_id, read_at"
        )
        .or(`sender_id.eq.${currentUserUuid},receiver_id.eq.${currentUserUuid}`)
        .order("created_at", { ascending: false });
      if (!error && data) {
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
            if (
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
                    sharedSecret
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
      }
      setLoading(false);
    };
    fetchInbox();

    // Realtime subscription
    const channel = supabase
      .channel("direct_messages_inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const msg = payload.new;
          if (!msg) return;
          const partnerId =
            msg.sender_id === currentUserUuid ? msg.receiver_id : msg.sender_id;
          if (
            partnerId &&
            (msg.sender_id === currentUserUuid ||
              msg.receiver_id === currentUserUuid)
          ) {
            setConversations((prev) => {
              const idx = prev.findIndex((c) => c.userId === partnerId);
              let unreadMap = getUnreadMap();
              // If the message is for the current user
              if (msg.receiver_id === currentUserUuid) {
                // Only process if this message hasn't been processed yet
                if (lastProcessedMsgIds.current[partnerId] !== msg.id) {
                  lastProcessedMsgIds.current[partnerId] = msg.id;
                  // If the conversation is open, mark as read immediately
                  if (activeConversationUserId === partnerId) {
                    unreadMap[partnerId] = 0;
                  } else {
                    unreadMap[partnerId] = (unreadMap[partnerId] || 0) + 1;
                  }
                  setUnreadMap(unreadMap);
                }
              }
              const sharedSecret =
                currentUserUuid < partnerId
                  ? `${currentUserUuid}:${partnerId}`
                  : `${partnerId}:${currentUserUuid}`;
              let lastMessage = "[Encrypted message]";
              if (
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
                      sharedSecret
                    ) || "[Encrypted message]";
                } catch {
                  lastMessage = "[Failed to decrypt message]";
                }
              }
              // Always update lastMessage and lastMessageAt for this conversation
              if (idx !== -1) {
                // Update existing conversation
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  lastMessage,
                  lastMessageAt: msg.created_at,
                  unreadCount: unreadMap[partnerId] || 0,
                };
                return updated;
              } else {
                // New conversation
                return [
                  {
                    userId: partnerId,
                    lastMessage,
                    lastMessageAt: msg.created_at,
                    unreadCount: unreadMap[partnerId] || 0,
                  },
                  ...prev,
                ];
              }
            });
          }
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserUuid, supabase, activeConversationUserId]);

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
