import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
import { useGroupEncryption } from "./useGroupEncryption";
import {
  decryptGroupMessage,
  type EncryptedMessage,
} from "@/shared/utils/encryption";
import { v4 as uuidv4 } from "uuid";

export interface ChatMessage {
  id: string;
  content: string;
  timestamp: string;
  sender: string;
  senderUsername?: string;
  avatar?: string;
  isCurrentUser: boolean;
  createdAt: string;
  status?: "sending" | "failed" | "sent";
  tempId?: string;
}

export interface GroupInfo {
  id: string;
  name: string;
  destination?: string;
  description?: string;
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

  // Fetch all messages (no pagination)
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

              // Use the current group key for decryption
              const currentGroupKey = groupKeyRef.current;
              console.log(
                "[Decrypt] Encrypted:",
                encryptedMessage,
                "GroupKey:",
                currentGroupKey,
                "GroupKeyRef:",
                groupKeyRef.current
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
        })
      );

      setMessages(decryptedMessages);
    } catch (err) {
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
    async (content: string, retryTempId?: string) => {
      if (!user || !content.trim()) return;
      const tempId = retryTempId || uuidv4();
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

        // Optimistic UI
        setMessages((prev) => [
          ...prev,
          {
            id: tempId,
            tempId,
            content: content.trim(),
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Asia/Kolkata",
            }),
            sender: user.fullName || user.username || "You",
            senderUsername: user.username || undefined,
            avatar: user.imageUrl,
            isCurrentUser: true,
            createdAt: new Date().toISOString(),
            status: "sending",
          },
        ]);

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

          // Handle specific error cases
          if (response.status === 403) {
            throw new Error("Not a member of this group");
          }
          if (response.status === 404) {
            throw new Error("Group not found");
          }

          throw new Error(
            `Failed to send message: ${errorData.error || response.statusText}`
          );
        }

        // Remove optimistic message (by tempId) on success
        setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));

        return { id: tempId, content: content.trim() }; // Return the tempId for retry
      } catch (err) {
        console.error("Error sending message:", err);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...msg, status: "failed" } : msg
          )
        );
        setError(err instanceof Error ? err.message : "Failed to send message");
        throw err;
      } finally {
        setSending(false);
      }
    },
    [groupId, user, encryptMessage, isEncryptionAvailable]
  );

  // Retry failed message
  const retrySendMessage = useCallback(
    async (failedMsg: ChatMessage) => {
      if (!failedMsg || !failedMsg.content) return;
      // Remove failed message before retrying
      setMessages((prev) =>
        prev.filter((msg) => msg.tempId !== failedMsg.tempId)
      );
      await sendMessage(failedMsg.content, failedMsg.tempId);
    },
    [sendMessage]
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
                    profile_photo,
                    deleted
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

            // Skip adding the message if it's from the current user and we already have it
            // (due to optimistic updates)
            setMessages((prev) => {
              const messageExists = prev.some(
                (msg) => msg.id === messageData.id
              );
              if (messageExists && isCurrentUser) {
                console.log(
                  "[Realtime] Skipping duplicate message from current user"
                );
                return prev;
              }

              // Decrypt the message if it's encrypted
              let decryptedContent = "[Encrypted message]";
              if (messageData.is_encrypted && messageData.encrypted_content) {
                try {
                  const encryptedMessage: EncryptedMessage = {
                    encryptedContent: messageData.encrypted_content,
                    iv: messageData.encryption_iv,
                    salt: messageData.encryption_salt,
                  };

                  // Use the current group key for decryption
                  const currentGroupKey = groupKeyRef.current;
                  console.log(
                    "[Realtime] Decrypting with key:",
                    currentGroupKey ? "Available" : "Not available",
                    "Encrypted message:",
                    encryptedMessage
                  );

                  decryptedContent = currentGroupKey
                    ? decryptGroupMessage(encryptedMessage, currentGroupKey)
                    : "[Encrypted message]";

                  console.log(
                    "[Realtime] Decryption result:",
                    decryptedContent
                  );
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
                    timeZone: "Asia/Kolkata",
                  }
                ),
                sender: (() => {
                  const profile = (messageData.users as any)?.profiles;
                  const isDeleted = profile?.deleted === true;
                  return isDeleted
                    ? "Deleted User"
                    : profile?.name || "Unknown User";
                })(),
                senderUsername: (() => {
                  const profile = (messageData.users as any)?.profiles;
                  const isDeleted = profile?.deleted === true;
                  return isDeleted ? undefined : profile?.username;
                })(),
                avatar: (() => {
                  const profile = (messageData.users as any)?.profiles;
                  const isDeleted = profile?.deleted === true;
                  return isDeleted ? undefined : profile?.profile_photo;
                })(),
                isCurrentUser,
                createdAt: messageData.created_at,
              };

              // If it's a new message (not from current user or not already in state)
              if (!messageExists) {
                console.log(
                  "[Realtime] Adding new message to state:",
                  formattedMessage
                );
                return [...prev, formattedMessage];
              }

              return prev;
            });
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
    retrySendMessage,
  };
};
