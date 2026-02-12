import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
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
  const [onlineMembers, setOnlineMembers] = useState<number>(0);

  // Initialize encryption
  const {
    encryptMessage,
    decryptMessage: decryptLocalMessage,
    isEncryptionAvailable,
    groupKey,
  } = useGroupEncryption(groupId);

  const groupKeyRef = useRef(groupKey);
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
    [groupId, user, encryptMessage, isEncryptionAvailable],
  );

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
    onlineMembers,
    sendMessage,
    refetch: fetchMessages,
  };
};
