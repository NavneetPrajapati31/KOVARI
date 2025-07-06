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
  avatar?: string;
  isCurrentUser: boolean;
  createdAt: string;
}

export interface GroupInfo {
  id: string;
  name: string;
  destination?: string;
  members_count?: number;
  cover_image?: string;
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
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();

      // Debug: Log the fetched messages
      console.log("[FetchMessages] Data:", data);

      // Map API fields to camelCase for decryption
      const mappedData = data.map((msg: any) => ({
        ...msg,
        isEncrypted: msg.isEncrypted ?? msg.is_encrypted,
        encryptedContent: msg.encryptedContent ?? msg.encrypted_content,
        encryptionIv: msg.encryptionIv ?? msg.encryption_iv,
        encryptionSalt: msg.encryptionSalt ?? msg.encryption_salt,
      }));

      console.log("[MappedData]", mappedData);

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
              const decryptedContent = groupKeyRef.current
                ? decryptGroupMessage(encryptedMessage, groupKeyRef.current)
                : null;
              console.log(
                "[Decrypt] Encrypted:",
                encryptedMessage,
                "GroupKey:",
                groupKeyRef.current,
                "Decrypted:",
                decryptedContent
              );
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
        })
      );

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
    async (content: string) => {
      if (!user || !content.trim()) return;

      try {
        setSending(true);
        setError(null);

        // Encrypt the message before sending (if encryption is available)
        let encryptedMessage = null;
        if (isEncryptionAvailable) {
          encryptedMessage = await encryptMessage(content.trim());
          if (!encryptedMessage) {
            setError(
              "Encryption failed: No encryption key or error in encryption."
            );
            console.error(
              "[E2EE] Encryption failed: encryptMessage returned null"
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
          throw new Error(
            `Failed to send message: ${errorData.error || response.statusText}`
          );
        }

        const newMessage = await response.json();

        // Decrypt the message for local display
        const decryptedMessage = {
          ...newMessage,
          content: content.trim(),
          isEncrypted: false,
        };

        return decryptedMessage;
      } catch (err) {
        console.error("Error sending message:", err);
        setError(err instanceof Error ? err.message : "Failed to send message");
        throw err;
      } finally {
        setSending(false);
      }
    },
    [groupId, user, encryptMessage, isEncryptionAvailable]
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
        async (payload) => {
          console.log("[Realtime] New message payload:", payload);
          try {
            // Fetch the complete message with user profile info
            const { data: messageData, error } = await supabase
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
              .eq("id", payload.new.id)
              .single();

            if (error || !messageData) {
              console.error("[Realtime] Error fetching new message:", error);
              return;
            }
            console.log("[Realtime] Fetched messageData:", messageData);

            // Get current user's internal ID to determine if it's their message
            const currentUserUuid = await getUserUuidByClerkId(user.id);
            const isCurrentUser = messageData.user_id === currentUserUuid;

            // Decrypt the message if it's encrypted
            let decryptedContent = messageData.content;
            if (messageData.is_encrypted && messageData.encrypted_content) {
              try {
                const encryptedMessage: EncryptedMessage = {
                  encryptedContent: messageData.encrypted_content,
                  iv: messageData.encryption_iv,
                  salt: messageData.encryption_salt,
                };
                decryptedContent =
                  decryptLocalMessage(encryptedMessage) ||
                  "[Encrypted message]";
              } catch (err) {
                console.error(
                  "[Realtime] Error decrypting real-time message:",
                  err
                );
                decryptedContent = "[Failed to decrypt message]";
              }
            }

            const formattedMessage: ChatMessage = {
              id: messageData.id,
              content: decryptedContent,
              timestamp: new Date(messageData.created_at).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                }
              ),
              sender:
                (messageData.users as any)?.profiles?.name || "Unknown User",
              senderUsername: (messageData.users as any)?.profiles?.username,
              avatar: (messageData.users as any)?.profiles?.profile_photo,
              isCurrentUser,
              createdAt: messageData.created_at,
            };

            // Always add the message to the state (even if it's from the current user)
            setMessages((prev) => [...prev, formattedMessage]);
            console.log("[Realtime] Added message to state:", formattedMessage);
          } catch (err) {
            console.error(
              "[Realtime] Error processing real-time message:",
              err
            );
          }
        }
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
