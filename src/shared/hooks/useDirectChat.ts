import { useState, useEffect, useCallback } from "react";
import { encryptMessage } from "@/shared/utils/encryption";
import { v4 as uuidv4 } from "uuid";

export interface DirectChatMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  encrypted_content?: string;
  encryption_iv?: string;
  encryption_salt?: string;
  is_encrypted?: boolean;
  created_at: string;
  status?: "sending" | "failed" | "sent";
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
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [offset, setOffset] = useState(0);

  // Shared secret for encryption
  const sharedSecret =
    currentUserUuid < partnerUuid
      ? `${currentUserUuid}:${partnerUuid}`
      : `${partnerUuid}:${currentUserUuid}`;

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

          if (loadMore) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newMessages = chronologicalMessages.filter(
                (msg: DirectChatMessage) => !existingIds.has(msg.id),
              );
              return [...newMessages, ...prev];
            });
            setOffset((prev) => prev + 30);
          } else {
            setMessages(chronologicalMessages);
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
      setMessages((prev) => [...prev, optimisticMsg]);
      try {
        let encrypted = { encryptedContent: "", iv: "", salt: "" };
        let isEncrypted = false;
        if (hasText) {
          encrypted = await encryptMessage(value.trim(), sharedSecret);
          isEncrypted = true;
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
    [currentUserUuid, partnerUuid, sharedSecret],
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
