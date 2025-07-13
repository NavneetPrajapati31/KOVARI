import { useState, useEffect, useCallback, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { createClient } from "@/lib/supabase";
import { encryptMessage, decryptMessage } from "@/shared/utils/encryption";
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
}

export interface UseDirectChatResult {
  messages: DirectChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  sendMessage: (value: string) => Promise<void>;
  markMessagesRead: () => Promise<void>;
  loadMoreMessages: () => Promise<void>;
  hasMoreMessages: boolean;
  loadingMore: boolean;
}

export const useDirectChat = (
  currentUserUuid: string,
  partnerUuid: string
): UseDirectChatResult => {
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [offset, setOffset] = useState(0);
  const supabase = createClient();
  const isMounted = useRef(true);

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
      } else {
        setLoading(true);
      }

      const orFilter = `and(sender_id.eq.${currentUserUuid},receiver_id.eq.${partnerUuid}),and(sender_id.eq.${partnerUuid},receiver_id.eq.${currentUserUuid})`;

      try {
        let query = supabase
          .from("direct_messages")
          .select(
            `
          *,
          sender:users!direct_messages_sender_id_fkey(
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
          .or(orFilter)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .range(offset, offset + 4); // Fetch 5 messages per page

        const { data, error } = await query;

        if (error) {
          setError(error.message);
          if (!loadMore) {
            setMessages([]);
          }
        } else if (data) {
          // Transform messages to include sender profile information
          const transformedMessages = data.map((msg: any) => ({
            ...msg,
            sender_profile: msg.sender?.profiles?.[0] || undefined,
          }));

          // Always reverse to chronological order (oldest at top)
          const chronologicalMessages = transformedMessages.reverse();

          if (loadMore) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const newMessages = chronologicalMessages.filter(
                (msg) => !existingIds.has(msg.id)
              );
              return [...newMessages, ...prev];
            });
            setOffset((prev) => prev + 5);
          } else {
            setMessages(chronologicalMessages);
            setOffset(5);
          }

          setHasMoreMessages(transformedMessages.length === 5);
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
    [currentUserUuid, partnerUuid, supabase, offset]
  );

  // Load more messages function
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMoreMessages) return;
    await fetchMessages(true);
  }, [fetchMessages, loadingMore, hasMoreMessages]);

  // Send a message (optimistic)
  const sendMessage = useCallback(
    async (value: string) => {
      if (!value.trim() || !currentUserUuid || !partnerUuid) return;
      setError(null);
      const tempId = uuidv4();
      const clientId = uuidv4();
      const optimisticMsg: DirectChatMessage = {
        id: tempId,
        tempId,
        sender_id: currentUserUuid,
        receiver_id: partnerUuid,
        encrypted_content: "",
        encryption_iv: "",
        encryption_salt: "",
        is_encrypted: true,
        created_at: new Date().toISOString(),
        status: "sending",
        plain_content: value.trim(),
        client_id: clientId,
      };
      setSending(true);
      setMessages((prev) => [...prev, optimisticMsg]);
      try {
        const encrypted = await encryptMessage(value.trim(), sharedSecret);
        const { data, error: insertError } = await supabase
          .from("direct_messages")
          .insert([
            {
              sender_id: currentUserUuid,
              receiver_id: partnerUuid,
              encrypted_content: encrypted.encryptedContent,
              encryption_iv: encrypted.iv,
              encryption_salt: encrypted.salt,
              is_encrypted: true,
              client_id: clientId,
            },
          ])
          .select()
          .single();
        if (insertError || !data) {
          throw new Error(insertError?.message || "Failed to send message");
        }
        // Optimistic message will be replaced by real-time update
      } catch (err: any) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...msg, status: "failed" } : msg
          )
        );
        setError(err.message || "Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [currentUserUuid, partnerUuid, sharedSecret, supabase]
  );

  // Add markMessagesRead function
  const markMessagesRead = useCallback(async () => {
    if (!currentUserUuid || !partnerUuid) return;
    try {
      await supabase
        .from("direct_messages")
        .update({ read_at: new Date().toISOString() })
        .eq("receiver_id", currentUserUuid)
        .eq("sender_id", partnerUuid)
        .is("read_at", null);
    } catch (err) {
      // Optionally handle error
    }
  }, [currentUserUuid, partnerUuid, supabase]);

  // Real-time subscription
  useEffect(() => {
    isMounted.current = true;
    if (!currentUserUuid || !partnerUuid) return;
    const channel = supabase
      .channel("direct_messages")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "direct_messages" },
        async (payload: any) => {
          const msg = payload.new as DirectChatMessage;
          // Only add if it's for this chat
          const isRelevant =
            (msg.sender_id === currentUserUuid &&
              msg.receiver_id === partnerUuid) ||
            (msg.sender_id === partnerUuid &&
              msg.receiver_id === currentUserUuid);
          if (!isRelevant) return;

          // Fetch sender profile information for the new message
          try {
            const { data: senderData } = await supabase
              .from("users")
              .select(
                `
                id,
                profiles(
                  name,
                  username,
                  profile_photo,
                  deleted
                )
              `
              )
              .eq("id", msg.sender_id)
              .single();

            const messageWithProfile: DirectChatMessage = {
              ...msg,
              sender_profile: senderData?.profiles?.[0] || undefined,
            };

            setMessages((prev) => {
              // Remove optimistic message if client_id matches
              const filtered = prev.filter((optimisticMsg) => {
                if (!optimisticMsg.client_id) return true;
                return optimisticMsg.client_id !== msg.client_id;
              });
              // Add the real message if not already present
              if (filtered.some((m) => m.id === msg.id)) return filtered;
              return [...filtered, messageWithProfile];
            });
          } catch (err) {
            console.error(
              "Error fetching sender profile for real-time message:",
              err
            );
            // Add message without profile info if fetch fails
            setMessages((prev) => {
              const filtered = prev.filter((optimisticMsg) => {
                if (!optimisticMsg.client_id) return true;
                return optimisticMsg.client_id !== msg.client_id;
              });
              if (filtered.some((m) => m.id === msg.id)) return filtered;
              return [...filtered, msg];
            });
          }
        }
      )
      .on(
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table: "direct_messages" },
        (payload: any) => {
          const msg = payload.new as DirectChatMessage;
          // Only update if it's for this chat
          const isRelevant =
            (msg.sender_id === currentUserUuid &&
              msg.receiver_id === partnerUuid) ||
            (msg.sender_id === partnerUuid &&
              msg.receiver_id === currentUserUuid);
          if (!isRelevant) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === msg.id ? { ...m, read_at: msg.read_at } : m
            )
          );
        }
      )
      .subscribe();
    return () => {
      isMounted.current = false;
      supabase.removeChannel(channel);
    };
  }, [currentUserUuid, partnerUuid, sharedSecret, supabase]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserUuid, partnerUuid]);

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
