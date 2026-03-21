import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
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

  const chatId = getGroupChatId(groupId);

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
        if (response.status === 403) {
          throw new Error("Not a member of this group");
        }
        if (response.status === 404) {
          throw new Error("Group not found");
        }
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();

      // Debug: Log the fetched messages
      console.log("[FetchMessages] Data:", data);

      // Map API fields to camelCase for decryption and always ensure mediaUrl/mediaType
      const mappedData = data.map((msg: any) => ({
        ...msg,
        isEncrypted: msg.isEncrypted ?? msg.is_encrypted,
        encryptedContent: msg.encryptedContent ?? msg.encrypted_content,
        encryptionIv: msg.encryptionIv ?? msg.encryption_iv,
        encryptionSalt: msg.encryptionSalt ?? msg.encryption_salt,
        mediaUrl: msg.mediaUrl ?? msg.media_url ?? undefined,
        mediaType: msg.mediaType ?? msg.media_type ?? undefined,
      }));

      console.log("[MappedData]", mappedData);

      // Debug: Log mappedData for media fields
      mappedData.forEach((msg: any, idx: number) => {
        console.log(
          `[MappedData][${idx}] id:`,
          msg.id,
          "mediaUrl:",
          msg.mediaUrl,
          "mediaType:",
          msg.mediaType,
        );
      });

      // Decrypt encrypted messages
      const decryptedMessages = await Promise.all(
        mappedData.map(async (message: any) => {
          if (message.isEncrypted && message.encryptedContent) {
            try {
              const encryptedMessage: EncryptedMessage = {
                encryptedContent: message.encryptedContent,
                iv: message.encryptionIv,
                salt: message.encryptionSalt,
              };

              // Use the current group key for decryption
              const currentGroupKey = groupKeyRef.current;
              console.log(
                "[Decrypt] Encrypted:",
                encryptedMessage,
                "GroupKey:",
                currentGroupKey,
                "GroupKeyRef:",
                groupKeyRef.current,
              );

              const decryptedContent = currentGroupKey
                ? decryptGroupMessage(encryptedMessage, currentGroupKey)
                : null;

              console.log("[Decrypt] Result:", decryptedContent);

              return {
                ...message,
                content: decryptedContent || "[Encrypted message]",
                isEncrypted: false,
              };
            } catch (err) {
              console.error("Error decrypting message:", err);
              return {
                ...message,
                content: "[Failed to decrypt message]",
                isEncrypted: false,
              };
            }
          }
          return message;
        }),
      );

      // Debug: Log decryptedMessages for media fields
      decryptedMessages.forEach((msg: any, idx: number) => {
        console.log(
          `[DecryptedMessages][${idx}] id:`,
          msg.id,
          "mediaUrl:",
          msg.mediaUrl,
          "mediaType:",
          msg.mediaType,
        );
      });

      // Populate seenIds
      decryptedMessages.forEach((msg: any) => {
         if (msg.id) seenIdsRef.current.add(msg.id);
         if (msg.tempId) seenIdsRef.current.add(msg.tempId);
      });

      setMessages(decryptedMessages);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }, [groupId, user]);

  // Fetch group information
  const fetchGroupInfo = useCallback(async () => {
    try {
      const response = await fetch(`/api/groups/${groupId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch group info");
      }

      const data = await response.json();
      setGroupInfo(data);
    } catch (err) {
      console.error("Error fetching group info:", err);
    }
  }, [groupId]);

  // Send a message
  const sendMessage = useCallback(
    async (
      content: string,
      mediaUrl?: string,
      mediaType?: "image" | "video",
    ) => {
      if (!user || (!content.trim() && !mediaUrl)) return;

      try {
        setSending(true);
        setError(null);

        // Encrypt the message before sending (if encryption is available)
        let encryptedMessage = null;
        if (isEncryptionAvailable && content.trim()) {
          encryptedMessage = await encryptMessage(content.trim());
          if (!encryptedMessage) {
            setError(
              "Encryption failed: No encryption key or error in encryption.",
            );
            console.error(
              "[E2EE] Encryption failed: encryptMessage returned null",
            );
            return;
          }
        }

        // Socket.IO Integration - Optimistic Send
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
                  avatar: user.imageUrl || undefined
              };
              
              socket.emit("send_message", {
                  chatId,
                  message: incomingMsg
              }, (ack) => {
                 // The server acknowledged standard delivery routing
              });
              
              const decryptedMessage: ChatMessage = {
                id: tempId,
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
              };
              
              seenIdsRef.current.add(tempId);
              setMessages((prev) => [...prev, decryptedMessage]);
              setSending(false);
              return decryptedMessage;
           }
        }

        // Debug: Log what is being sent
        console.log("[E2EE] Sending message payload:", {
          content: content.trim(),
          encryptedContent: encryptedMessage?.encryptedContent || null,
          encryptionIv: encryptedMessage?.iv || null,
          encryptionSalt: encryptedMessage?.salt || null,
          isEncrypted: !!encryptedMessage,
          mediaUrl,
          mediaType,
        });

        const response = await fetch(`/api/groups/${groupId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
          const errorData = await response
            .json()
            .catch(() => ({ error: "Unknown error" }));
          console.error("API Error:", {
            status: response.status,
            statusText: response.statusText,
            error: errorData,
          });

          // Handle specific error cases
          if (response.status === 403) {
            throw new Error("Not a member of this group");
          }
          if (response.status === 404) {
            throw new Error("Group not found");
          }

          throw new Error(
            `Failed to send message: ${errorData.error || response.statusText}`,
          );
        }

        const newMessage = await response.json();

        // Create the decrypted message for local display
        const decryptedMessage: ChatMessage = {
          id: newMessage.id,
          content: content.trim(), // Use the original content for immediate display
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
        };

        // Add the message optimistically to the UI
        setMessages((prev) => [...prev, decryptedMessage]);

        return decryptedMessage;
      } catch (err) {
        console.error("Error sending message:", err);
        setError(err instanceof Error ? err.message : "Failed to send message");
        throw err;
      } finally {
        setSending(false);
      }
    },
    [groupId, user, encryptMessage, isEncryptionAvailable, chatId],
  );

  // Socket.IO Integration Setup
  useEffect(() => {
    if (!user?.id || !chatId || !isEncryptionAvailable) return;

    const socket = getSocket(user.id);
    if (!socket.connected) socket.connect();

    const onConnect = () => {
      socket.emit("join_chat", { chatId });
      fetchMessages(); // re-sync any missed messages from the DB upon reconnect
    };

    socket.on("connect", onConnect);
    if (socket.connected) {
      socket.emit("join_chat", { chatId });
    }    socket.emit("join_chat", { chatId });

    const handleReceiveMessage = (incomingMsg: any) => {
      const msgId = incomingMsg.id || incomingMsg.tempId;
      if (msgId && seenIdsRef.current.has(msgId)) return;
      if (msgId) seenIdsRef.current.add(msgId);
      if (incomingMsg.tempId) seenIdsRef.current.add(incomingMsg.tempId);

      setMessages((prev) => {
        const exists = prev.some(m => m.id === incomingMsg.id || (incomingMsg.tempId && m.id === incomingMsg.tempId));
        if (exists) {
           return prev.map(m => (m.id === incomingMsg.id || m.id === incomingMsg.tempId) ? { ...m, ...incomingMsg } : m);
        }

        const currentGroupKey = groupKeyRef.current;
        let decryptedContent = "[Encrypted message]";

        if (incomingMsg.isEncrypted && incomingMsg.encryptedContent) {
            try {
               if (currentGroupKey) {
                   decryptedContent = decryptGroupMessage({
                       encryptedContent: incomingMsg.encryptedContent,
                       iv: incomingMsg.iv,
                       salt: incomingMsg.salt
                   }, currentGroupKey) || "[Encrypted message]";
               }
            } catch(e) {}
        } else {
            decryptedContent = incomingMsg.content || "";
        }

        const newMessage: ChatMessage = {
           id: incomingMsg.id || incomingMsg.tempId,
           content: decryptedContent,
           timestamp: new Date(incomingMsg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }),
           sender: incomingMsg.senderName || "Unknown User",
           senderUsername: incomingMsg.senderUsername,
           avatar: incomingMsg.avatar,
           isCurrentUser: incomingMsg.senderId === user.id,
           createdAt: incomingMsg.createdAt,
           mediaUrl: incomingMsg.mediaUrl,
           mediaType: incomingMsg.mediaType,
        };
        
        return [...prev, newMessage];
      });
    };

    const handleMessagePersisted = (ack: { tempId: string, messageId: string, chatId: string }) => {
       if (ack.chatId === chatId) {
          seenIdsRef.current.add(ack.messageId);
          setMessages((prev) => prev.map(m => m.id === ack.tempId ? { ...m, id: ack.messageId } : m));
       }
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_persisted", handleMessagePersisted);

    return () => {
      socket.off("connect", onConnect);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_persisted", handleMessagePersisted);
      socket.emit("leave_chat", { chatId });
    };
  }, [user?.id, chatId, isEncryptionAvailable, fetchMessages]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user || !isEncryptionAvailable) return;

    const supabase = createClient();

    // Subscribe to new messages
    const channel = supabase
      .channel(`group_messages_${groupId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "group_messages",
          filter: `group_id=eq.${groupId}`,
        },
        async () => {
          // With RLS enabled, client-side selects with joins (users/profiles) can be blocked.
          // The API route enforces membership and uses server-side DB access, so refetch via API.
          try {
            await fetchMessages();
          } catch (e) {
            // ignore; fetchMessages already sets error state
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [groupId, user, isEncryptionAvailable]);

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
  };
};
