import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
import { getSocket } from "@/lib/socket";
import { getGroupChatId } from "@/shared/utils/chatId";
import { useGroupEncryption } from "./useGroupEncryption";
import {
  decryptGroupMessage,
  type EncryptedMessage,
} from "@/shared/utils/encryption";

export interface ChatMessage {
  id: string;
  tempId?: string;
  content: string;
  timestamp: string;
  sender: string;
  senderUsername?: string;
  senderId?: string;
  avatar?: string;
  isCurrentUser: boolean;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: "image" | "video";
  status?: "sending" | "sent" | "delivered" | "seen";
  isEncrypted?: boolean;
}

export interface GroupInfo {
  id: string;
  name: string;
  destination?: string;
  description?: string;
  members_count?: number;
  cover_image?: string;
  status?: "active" | "pending" | "removed";
}

export const useGroupChat = (groupId: string) => {
  const { user } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [currentUserUuid, setCurrentUserUuid] = useState<string>("");

  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Online member tracking (Supabase UUIDs)
  const [onlineMembers, setOnlineMembers] = useState<Set<string>>(new Set());
  const [currentUserAvatar, setCurrentUserAvatar] = useState<string | undefined>(undefined);

  const chatId = getGroupChatId(groupId);

  // Resolve current user UUID and Supabase profile photo
  useEffect(() => {
    if (user?.id) {
      getUserUuidByClerkId(user.id).then((uuid) => {
        setCurrentUserUuid(uuid || "");
        if (uuid) {
          // Fetch Supabase profile_photo (not Clerk imageUrl)
          fetch(`/api/groups/${groupId}/members`)
            .then((r) => r.json())
            .then((members: any[]) => {
              const me = members.find((m: any) => m.userId === uuid || m.user_id === uuid);
              if (me?.avatar) setCurrentUserAvatar(me.avatar);
            })
            .catch(() => {});
        }
      });
    }
  }, [user?.id, groupId]);

  // Initialize encryption
  const {
    encryptMessage,
    decryptMessage: decryptLocalMessage,
    isEncryptionAvailable,
    groupKey,
  } = useGroupEncryption(groupId);

  const groupKeyRef = useRef(groupKey);
  const seenIdsRef = useRef(new Set<string>());
  useEffect(() => {
    groupKeyRef.current = groupKey;
  }, [groupKey]);

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/groups/${groupId}/messages`);
      if (!response.ok) {
        if (response.status === 403) throw new Error("Not a member of this group");
        if (response.status === 404) throw new Error("Group not found");
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();

      const mappedData = data.map((msg: any) => ({
        ...msg,
        isEncrypted: msg.isEncrypted ?? msg.is_encrypted,
        encryptedContent: msg.encryptedContent ?? msg.encrypted_content,
        encryptionIv: msg.encryptionIv ?? msg.encryption_iv,
        encryptionSalt: msg.encryptionSalt ?? msg.encryption_salt,
        mediaUrl: msg.mediaUrl ?? msg.media_url ?? undefined,
        mediaType: msg.mediaType ?? msg.media_type ?? undefined,
      }));

      const decryptedMessages = await Promise.all(
        mappedData.map(async (message: any) => {
          if (message.isEncrypted && message.encryptedContent) {
            try {
              const encryptedMessage: EncryptedMessage = {
                encryptedContent: message.encryptedContent,
                iv: message.encryptionIv,
                salt: message.encryptionSalt,
              };
              const currentGroupKey = groupKeyRef.current;
              const decryptedContent = currentGroupKey
                ? decryptGroupMessage(encryptedMessage, currentGroupKey)
                : null;

              return {
                ...message,
                content: decryptedContent || "[Encrypted message]",
                isEncrypted: false,
              };
            } catch (err) {
              return { ...message, content: "[Failed to decrypt message]", isEncrypted: false };
            }
          }
          return message;
        }),
      );

      setMessages((prev) => {
        // Build a map of existing messages for quick lookup
        const existingMessages = new Map(prev.map((m) => [m.id, m]));
        const existingTempMessages = new Map(
          prev.filter((m) => m.tempId).map((m) => [m.tempId!, m])
        );

        const mergedMessages = decryptedMessages.map((msg) => {
          const existing = existingMessages.get(msg.id) || existingTempMessages.get(msg.id);
          
          let status = msg.status;
          if (!status) {
             if (existing?.status) {
                status = existing.status;
             } else {
                status = msg.senderId === user?.id ? "sent" : "delivered";
             }
          }
          
          return { ...msg, status };
        });

        // Combine new messages with existing ones that are still in-flight or delivered but not yet seen in the DB list
        const pendingMessages = prev.filter(
          (m) =>
            m.tempId && // Is an optimistic message
            (m.status === "sending" || m.status === "sent" || m.status === "delivered") &&
            !decryptedMessages.some((dm) => dm.id === m.id || dm.id === m.tempId)
        );

        return [...mergedMessages, ...pendingMessages];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }, [groupId, user?.id]);

  // Fetch group information
  const fetchGroupInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      if (!response.ok) throw new Error("Failed to fetch group info");
      const data = await response.json();
      setGroupInfo(data);
    } catch (err) {
      console.error("Error fetching group info:", err);
    }
  }, [groupId]);

  const stopTyping = useCallback(() => {
    if (user?.id && chatId) {
      const socket = getSocket(user.id);
      if (socket.connected) socket.emit("typing_stop", { chatId });
    }
  }, [user?.id, chatId]);

  const sendTypingEvent = useCallback(() => {
    if (user?.id && chatId) {
      const socket = getSocket(user.id);
      if (socket.connected) {
        socket.emit("typing_start", { chatId });
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(stopTyping, 2500);
      }
    }
  }, [user?.id, chatId, stopTyping]);

  // Send a message
  const sendMessage = useCallback(
    async (content: string, mediaUrl?: string, mediaType?: "image" | "video") => {
      if (!user || (!content.trim() && !mediaUrl)) return;

      try {
        setSending(true);
        setError(null);

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        stopTyping();

        let encryptedMessage = null;
        if (isEncryptionAvailable && content.trim()) {
          encryptedMessage = await encryptMessage(content.trim());
          if (!encryptedMessage) {
            setError("Encryption failed: No encryption key or error in encryption.");
            return;
          }
        }

        // Socket.IO optimistic send
        if (user?.id && chatId) {
          const socket = getSocket(user.id);
          if (socket.connected) {
            const tempId = crypto.randomUUID();

            const incomingMsg = {
              id: tempId,
              tempId,
              senderId: user.id,
              encryptedContent: encryptedMessage?.encryptedContent || "",
              iv: encryptedMessage?.iv || "",
              salt: encryptedMessage?.salt || "",
              mediaUrl: mediaUrl || undefined,
              mediaType: mediaType || undefined,
              createdAt: new Date().toISOString(),
              isEncrypted: !!encryptedMessage,
              senderName: user.fullName || user.firstName || "Unknown User",
              senderUsername: user.username || undefined,
              avatar: currentUserAvatar || undefined,
            };

            // Add optimistic message with "sending" status
            const optimisticMessage: ChatMessage = {
              id: tempId,
              tempId,
              content: content.trim(),
              timestamp: new Date(incomingMsg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                timeZone: "Asia/Kolkata",
              }),
              sender: incomingMsg.senderName,
              senderUsername: incomingMsg.senderUsername,
              avatar: incomingMsg.avatar,
              isCurrentUser: true,
              createdAt: incomingMsg.createdAt,
              mediaUrl,
              mediaType,
              status: "sending",
            };

            seenIdsRef.current.add(tempId);
            setMessages((prev) => [...prev, optimisticMessage]);

            socket.emit("send_message", { chatId, message: incomingMsg }, (ack) => {
              // Level 1 ack: server received it, upgrade to "sent"
              setMessages((prev) =>
                prev.map((m) =>
                  m.tempId === tempId || m.id === tempId
                    ? { ...m, status: "sent" }
                    : m
                )
              );
            });

            setSending(false);
            return optimisticMessage;
          }
        }

        // Fallback: HTTP send
        const response = await fetch(`/api/groups/${groupId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: content.trim(),
            encryptedContent: encryptedMessage?.encryptedContent || null,
            encryptionIv: encryptedMessage?.iv || null,
            encryptionSalt: encryptedMessage?.salt || null,
            isEncrypted: !!encryptedMessage,
            mediaUrl,
            mediaType,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          if (response.status === 403) throw new Error("Not a member of this group");
          if (response.status === 404) throw new Error("Group not found");
          throw new Error(`Failed to send message: ${errorData.error || response.statusText}`);
        }

        const newMessage = await response.json();
        const decryptedMessage: ChatMessage = {
          id: newMessage.id,
          content: content.trim(),
          timestamp: new Date(newMessage.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          }),
          sender: newMessage.sender,
          senderUsername: newMessage.senderUsername,
          avatar: newMessage.avatar,
          isCurrentUser: true,
          createdAt: newMessage.createdAt,
          mediaUrl,
          mediaType,
          status: "sent",
        };

        setMessages((prev) => [...prev, decryptedMessage]);
        return decryptedMessage;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to send message");
        throw err;
      } finally {
        setSending(false);
      }
    },
    [groupId, user, encryptMessage, isEncryptionAvailable, chatId, stopTyping, currentUserAvatar],
  );

  const notifyMessagesSeen = useCallback(
    (messageIds: string[]) => {
      if (!user?.id || !chatId) return;
      const socket = getSocket(user.id);
      if (socket && socket.connected && messageIds.length > 0) {
        socket.emit("mark_seen", { chatId, messageIds });
      }
    },
    [chatId, user?.id],
  );

  const handleMessagesSeen = useCallback(({ messageIds, isFullySeen }: any) => {
    setMessages((prev) =>
      prev.map((m) =>
        messageIds.includes(m.id) || messageIds.includes(m.tempId || "")
          ? { ...m, status: isFullySeen ? "seen" : m.status }
          : m
      )
    );
  }, []);

  const handleReceiveMessage = useCallback(async (incomingMsg: any) => {
    const msgId = incomingMsg.id || incomingMsg.tempId;
    if (msgId && seenIdsRef.current.has(msgId)) return;
    if (msgId) seenIdsRef.current.add(msgId);
    if (incomingMsg.tempId) seenIdsRef.current.add(incomingMsg.tempId);

    setMessages((prev) => {
      const exists = prev.some(
        (m) =>
          m.id === incomingMsg.id ||
          m.id === incomingMsg.tempId ||
          (m.tempId && m.tempId === incomingMsg.tempId) ||
          (m.tempId && m.tempId === incomingMsg.id)
      );
      if (exists) return prev;

      const currentGroupKey = groupKeyRef.current;
      let decryptedContent = "[Encrypted message]";

      if (incomingMsg.isEncrypted && incomingMsg.encryptedContent) {
        try {
          if (currentGroupKey) {
            decryptedContent = decryptGroupMessage(
              { encryptedContent: incomingMsg.encryptedContent, iv: incomingMsg.iv, salt: incomingMsg.salt },
              currentGroupKey
            ) || "[Encrypted message]";
          }
        } catch (e) {}
      } else {
        decryptedContent = incomingMsg.content || "";
      }

      const isFromMe = incomingMsg.senderId === user?.id;

      // Emit delivery ack for messages from others
      if (!isFromMe && incomingMsg.id) {
        const socket = getSocket(user?.id || "");
        socket.emit("message_delivered", { chatId, messageId: incomingMsg.id });
      }

      const newMessage: ChatMessage = { // Changed from GroupChatMessage to ChatMessage
        id: incomingMsg.id,
        tempId: incomingMsg.tempId,
        content: decryptedContent,
        senderId: incomingMsg.senderId,
        sender: incomingMsg.senderName || "Unknown",
        avatar: incomingMsg.avatar,
        status: isFromMe ? "sent" : "delivered",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: "Asia/Kolkata" }), // Added timeZone
        createdAt: incomingMsg.createdAt || new Date().toISOString(),
        isCurrentUser: isFromMe,
        isEncrypted: incomingMsg.isEncrypted,
        mediaUrl: incomingMsg.mediaUrl,
        mediaType: incomingMsg.mediaType,
        senderUsername: incomingMsg.senderUsername, // Added senderUsername
      };

      const merged = [...prev, newMessage];
      return merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
  }, [user?.id, chatId, decryptGroupMessage, groupKeyRef, seenIdsRef]); // Added decryptGroupMessage, groupKeyRef, seenIdsRef to deps

  // Socket.IO Integration Setup
  useEffect(() => {
    if (!user?.id || !chatId || !isEncryptionAvailable) return;

    const socket = getSocket(user.id);
    if (!socket.connected) socket.connect();

    const onConnect = () => {
      socket.emit("join_chat", { chatId });
      fetchMessages();
    };

    socket.on("connect", onConnect);
    if (socket.connected) {
      socket.emit("join_chat", { chatId });
      // Don't call fetchMessages here — it runs via the initial useEffect.
      // Only re-sync on a genuine reconnect (onConnect).
    }

    const handleMessagePersisted = (ack: { tempId: string; messageId: string; chatId: string }) => {
      if (ack.chatId === chatId) {
        seenIdsRef.current.add(ack.messageId);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === ack.tempId || m.tempId === ack.tempId
              ? { ...m, id: ack.messageId, status: m.status === "sending" ? "sent" : m.status }
              : m
          )
        );
      }
    };

    const handleMessageDeliveredAck = ({ messageId, chatId: targetChat }: any) => {
      if (targetChat === chatId) {
        setMessages((prev) =>
          prev.map((m) =>
            (m.id === messageId || m.tempId === messageId) &&
            (m.status === "sent" || m.status === "sending")
              ? { ...m, status: "delivered" }
              : m
          )
        );
      }
    };

    const handleUserTyping = ({ chatId: targetChat, userId: typingUserId }: any) => {
      if (targetChat === chatId && typingUserId !== user.id) {
        setTypingUsers((prev) => new Set(prev).add(typingUserId));
      }
    };

    const handleUserStoppedTyping = ({ chatId: targetChat, userId: typingUserId }: any) => {
      if (targetChat === chatId) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(typingUserId);
          return next;
        });
      }
    };

    const handleUserOnline = ({ supabaseId }: any) => {
      if (supabaseId) setOnlineMembers((prev) => new Set(prev).add(supabaseId));
    };

    const handleUserOffline = ({ supabaseId }: any) => {
      if (supabaseId) {
        setOnlineMembers((prev) => {
          const next = new Set(prev);
          next.delete(supabaseId);
          return next;
        });
      }
    };

    socket.on("messages_seen", handleMessagesSeen);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_persisted", handleMessagePersisted);
    socket.on("message_delivered_ack", handleMessageDeliveredAck);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stopped_typing", handleUserStoppedTyping);
    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);

    return () => {
      socket.off("connect", onConnect);
      socket.off("messages_seen", handleMessagesSeen);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_persisted", handleMessagePersisted);
      socket.off("message_delivered_ack", handleMessageDeliveredAck);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stopped_typing", handleUserStoppedTyping);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.emit("leave_chat", { chatId });
    };
  }, [groupId, user?.id, handleReceiveMessage, handleMessagesSeen, fetchMessages, chatId, isEncryptionAvailable]); // Added chatId, isEncryptionAvailable to deps

  // Initial data fetch
  useEffect(() => {
    if (isEncryptionAvailable) {
      fetchMessages();
      fetchGroupInfo();
    }
  }, [fetchMessages, fetchGroupInfo, isEncryptionAvailable]);

  return {
    messages,
    loading,
    sending,
    error,
    groupInfo,
    sendMessage,
    refetch: fetchMessages,
    typingUsers,
    sendTypingEvent,
    onlineMembers,
    currentUserUuid,
    notifyMessagesSeen,
  };
};
