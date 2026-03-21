import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { encryptMessage, decryptMessage } from "@/shared/utils/encryption";
import { v4 as uuidv4 } from "uuid";
import { getSocket } from "@/lib/socket";
import { getDirectChatId } from "@/shared/utils/chatId";

export interface DirectChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  encrypted_content?: string;
  encryption_iv?: string;
  encryption_salt?: string;
  is_encrypted?: boolean;
  created_at: string;
  status?: "sending" | "failed" | "sent" | "persisted";
  tempId?: string;
  plain_content?: string; // for optimistic UI
  client_id?: string;
  read_at?: string; // Added for read_at
  // Sender profile information
  sender_profile?: {
    name?: string;
    username?: string;
    profile_photo?: string;
    deleted?: boolean;
  };
  mediaUrl?: string;
  mediaType?: "image" | "video";
}

export interface UseDirectChatResult {
  messages: DirectChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  sendMessage: (
    value: string,
    mediaUrl?: string,
    mediaType?: "image" | "video",
  ) => Promise<void>;
  markMessagesRead: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  loadingMore: boolean;
}

export const useDirectChat = (
  currentUserUuid: string,
  partnerUuid: string,
): UseDirectChatResult => {
  const { user } = useUser();
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [offset, setOffset] = useState(0);

  const seenIdsRef = useRef(new Set<string>());

  // Shared secret for encryption
  const sharedSecret = useMemo(
    () =>
      currentUserUuid < partnerUuid
        ? `${currentUserUuid}:${partnerUuid}`
        : `${partnerUuid}:${currentUserUuid}`,
    [currentUserUuid, partnerUuid],
  );

  // Fetch initial messages with sender profile information
  const fetchMessages = useCallback(
    async (loadMore = false) => {
      if (!currentUserUuid || !partnerUuid) {
        setMessages([]);
        setLoading(false);
        return;
      }

      if (loadMore) {
        setLoadingMore(true);
      }


      try {
        const effectiveOffset = loadMore ? offset : 0;
        const response = await fetch(
          `/api/direct-chat/messages?partnerId=${encodeURIComponent(
            partnerUuid,
          )}&offset=${effectiveOffset}&limit=30`,
          { method: "GET", credentials: "include" },
        );
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          setError(errorBody?.error || "Failed to fetch messages");
          if (!loadMore) {
            setMessages([]);
          }
        } else {
          const payload = await response.json();
          const data = Array.isArray(payload?.messages) ? payload.messages : [];
          // Transform messages to include sender profile information and normalize media fields
          const transformedMessages = data.map((msg: any) => ({
            ...msg,
            sender_profile: msg.sender?.profiles?.[0] || undefined,
            mediaUrl: (msg as any)["media_url"] || msg.mediaUrl,
            mediaType: (msg as any)["media_type"] || msg.mediaType,
          }));

          // Always reverse to chronological order (oldest at top)
          const chronologicalMessages = transformedMessages.reverse();

          // Populate seenIdsRef with fetched message IDs
          chronologicalMessages.forEach((msg: DirectChatMessage) => {
            if (msg.id) seenIdsRef.current.add(msg.id);
            if (msg.tempId) seenIdsRef.current.add(msg.tempId);
            if (msg.client_id) seenIdsRef.current.add(msg.client_id);
          });

          if (loadMore) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const existingClientIds = new Set(prev.map((m) => m.client_id || m.tempId).filter(Boolean));
              
              const newMessages = chronologicalMessages.filter(
                (msg: DirectChatMessage) => !existingIds.has(msg.id) && !existingClientIds.has(msg.client_id),
              );
              return [...newMessages, ...prev];
            });
            setOffset((prev) => prev + 30);
          } else {
            // For regular polling refresh, we merge gracefully to preserve temp messages and avoid duplicates
            setMessages((prev) => {
              const existingClientIds = new Set(prev.map((m) => m.client_id || m.tempId).filter(Boolean));
              const prevMap = new Map(prev.map(m => [m.id, m]));
              
              const merged = [...prev];
              chronologicalMessages.forEach((msg: any) => {
                 if (prevMap.has(msg.id)) return;
                 // If the message has a client_id matching a tempId of a local optimistic message, update the local message
                 const localTempIndex = merged.findIndex(m => m.tempId && m.tempId === msg.client_id);
                 if (localTempIndex > -1) {
                    merged[localTempIndex] = { ...merged[localTempIndex], ...msg, status: "sent" };
                 } else if (!existingClientIds.has(msg.client_id)) {
                    merged.push(msg); // Add new completed message from polling
                 }
              });
              // Sort by created_at 
              return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            });
            setOffset(30);
          }

          setHasMoreMessages(transformedMessages.length === 30);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch messages");
        if (!loadMore) {
          setMessages([]);
        }
      } finally {
        if (loadMore) {
          setLoadingMore(false);
        } else {
          setLoading(false);
        }
      }
    },
    [currentUserUuid, partnerUuid, offset],
  );

  // Load more messages function
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMoreMessages) return;
    await fetchMessages(true);
  }, [fetchMessages, loadingMore, hasMoreMessages]);

  // Send a message (optimistic)
  const sendMessage = useCallback(
    async (value: string, mediaUrl?: string, mediaType?: "image" | "video") => {
      if ((!value.trim() && !mediaUrl) || !currentUserUuid || !partnerUuid)
        return;
      setError(null);
      const tempId = uuidv4();
      const clientId = uuidv4();
      const hasText = !!value.trim();
      const optimisticMsg: DirectChatMessage = {
        id: tempId,
        tempId,
        sender_id: currentUserUuid,
        receiver_id: partnerUuid,
        encrypted_content: "",
        encryption_iv: "",
        encryption_salt: "",
        is_encrypted: hasText,
        created_at: new Date().toISOString(),
        status: "sending",
        plain_content: value.trim(),
        client_id: clientId,
        mediaUrl,
        mediaType,
      };
      setSending(true);
      seenIdsRef.current.add(tempId); // Add tempId to seenIdsRef
      setMessages((prev) => [...prev, optimisticMsg]);
      try {
        let encrypted = { encryptedContent: "", iv: "", salt: "" };
        let isEncrypted = false;
        if (hasText) {
          encrypted = await encryptMessage(value.trim(), sharedSecret);
          isEncrypted = true;
        }

        // [SOCKET INTEGRATION - Optimistic send via Socket]
        const chatId = getDirectChatId(currentUserUuid, partnerUuid);
        if (user?.id && chatId) {
           const socket = getSocket(user.id);
           if (socket.connected) {
             socket.emit("send_message", {
                chatId,
                message: {
                   id: tempId, // Use tempId as id for optimistic socket message
                   tempId,
                   senderId: currentUserUuid,
                   encryptedContent: isEncrypted ? encrypted.encryptedContent : "",
                   iv: isEncrypted ? encrypted.iv : "",
                   salt: isEncrypted ? encrypted.salt : "",
                   mediaUrl: mediaUrl || undefined,
                   mediaType: mediaType || undefined,
                   createdAt: new Date().toISOString(),
                   isEncrypted
                }
             }, (ack) => {
                if (ack?.status === "sent") {
                   // This ack is for the socket server receiving the message, not necessarily persisted
                   // The message_persisted event will handle the final status update
                   setMessages((prev) => prev.map((m) => m.tempId === tempId ? { ...m, status: "sent" } : m));
                }
             });
             setSending(false);
             return; // Socket handled this and will persist. Client updates by polling or broadcast.
           }
        }

        const response = await fetch("/api/direct-chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            partnerId: partnerUuid,
            encrypted_content: isEncrypted ? encrypted.encryptedContent : null,
            encryption_iv: isEncrypted ? encrypted.iv : null,
            encryption_salt: isEncrypted ? encrypted.salt : null,
            is_encrypted: isEncrypted,
            clientId,
            media_url: mediaUrl ?? null,
            media_type: mediaType ?? null,
          }),
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody?.error || "Failed to send message");
        }
        const payload = await response.json();
        const data = payload?.message;
        const serverMessage: DirectChatMessage = {
          ...data,
          sender_profile: data?.sender?.profiles?.[0] || undefined,
          mediaUrl: data?.media_url || data?.mediaUrl,
          mediaType: data?.media_type || data?.mediaType,
          status: "sent",
        };
        setMessages((prev) =>
          prev.map((msg) => (msg.tempId === tempId ? serverMessage : msg)),
        );
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...msg, status: "failed" } : msg,
          ),
        );
        setError(err.message || "Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [currentUserUuid, partnerUuid, sharedSecret, user?.id],
  );

  // Add markMessagesRead function
  const markMessagesRead = useCallback(async () => {
    if (!currentUserUuid || !partnerUuid) return;
    try {
      await fetch("/api/direct-chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ partnerId: partnerUuid }),
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg.receiver_id === currentUserUuid &&
          msg.sender_id === partnerUuid &&
          !msg.read_at
            ? { ...msg, read_at: new Date().toISOString() }
            : msg,
        ),
      );
    } catch (err) {
      // Optionally handle error
    }
  }, [currentUserUuid, partnerUuid]);

  // Initial fetch
  useEffect(() => {
    setLoading(true);
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserUuid, partnerUuid]);

  // Socket.IO Integration Setup
  useEffect(() => {
    const chatId = currentUserUuid && partnerUuid ? getDirectChatId(currentUserUuid, partnerUuid) : null;
    if (!user?.id || !chatId) return;

    const socket = getSocket(user.id);
    if (!socket.connected) socket.connect();

    const onConnect = () => {
      socket.emit("join_chat", { chatId });
      fetchMessages(); // re-sync any missed messages from the DB
    };

    socket.on("connect", onConnect);
    if (socket.connected) {
      socket.emit("join_chat", { chatId });
    }

    const handleReceiveMessage = async (incomingMsg: any) => {
      const msgId = incomingMsg.id || incomingMsg.tempId || incomingMsg.client_id;
      if (msgId && seenIdsRef.current.has(msgId)) {
        // If we've already seen this message (e.g., from optimistic send or initial fetch),
        // we might want to update its status if it's an optimistic message becoming 'sent'
        setMessages((prev) => prev.map(m => 
          (m.tempId === incomingMsg.tempId || m.id === incomingMsg.id || m.client_id === incomingMsg.client_id)
          ? { ...m, ...incomingMsg, status: "sent" } // Update with server data
          : m
        ));
        return;
      }
      if (msgId) seenIdsRef.current.add(msgId);

      // We handle decryption inside state update to use the latest keys
      setMessages((prev) => {
        let finalContent = incomingMsg.encryptedContent;
        let finalIsEncrypted = incomingMsg.isEncrypted;

        if (incomingMsg.isEncrypted) {
          try {
            const tempMapped = {
              encryptedContent: incomingMsg.encryptedContent,
              iv: incomingMsg.iv,
              salt: incomingMsg.salt,
            };
            const decrypted = decryptMessage(tempMapped, sharedSecret); // Native fallback
            if (decrypted) {
              finalContent = decrypted;
              finalIsEncrypted = false;
            } else {
              finalContent = "[Encrypted Message]";
            }
          } catch (e) {
            console.error("Local socket decryption failed:", e);
            finalContent = "[Encrypted Message]";
          }
        } else {
            finalContent = incomingMsg.content || incomingMsg.plain_content || ""; // Use content or plain_content
        }

        // Constructing a DirectChatMessage, not ChatMessage as per the original type
        const newMessage: DirectChatMessage = {
          id: incomingMsg.id || incomingMsg.tempId,
          sender_id: incomingMsg.senderId,
          receiver_id: incomingMsg.senderId === currentUserUuid ? partnerUuid : currentUserUuid,
          encrypted_content: incomingMsg.encryptedContent,
          encryption_iv: incomingMsg.iv,
          encryption_salt: incomingMsg.salt,
          is_encrypted: incomingMsg.isEncrypted,
          created_at: incomingMsg.createdAt,
          plain_content: finalContent, // Store decrypted content here
          mediaUrl: incomingMsg.mediaUrl,
          mediaType: incomingMsg.mediaType,
          client_id: incomingMsg.tempId, // from optimism
          status: "sent",
        };
        
        const merged = [...prev, newMessage];
        return merged.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });
    };

    const handleMessagePersisted = (ack: { tempId: string, messageId: string, chatId: string }) => {
       if (ack.chatId === chatId) {
          seenIdsRef.current.add(ack.messageId);
          setMessages((prev) => prev.map(m => m.tempId === ack.tempId ? { ...m, id: ack.messageId, status: "persisted" } : m));
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
  }, [user?.id, currentUserUuid, partnerUuid, fetchMessages, decryptMessage]);

  // Poll messages to keep direct chat synced when RLS blocks client subscriptions
  useEffect(() => {
    if (!currentUserUuid || !partnerUuid) return;
    const interval = window.setInterval(() => {
      fetchMessages(false);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [currentUserUuid, partnerUuid, fetchMessages]);

  // Reset offset when chat changes
  useEffect(() => {
    setOffset(0);
    setHasMoreMessages(true);
    setMessages([]);
  }, [partnerUuid]);

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    markMessagesRead,
    loadMoreMessages,
    hasMoreMessages,
    loadingMore,
  };
};
