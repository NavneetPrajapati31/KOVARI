import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { decryptMessage } from "@/shared/utils/encryption";

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  encrypted_content?: string;
  encryption_iv?: string;
  encryption_salt?: string;
  is_encrypted?: boolean;
  created_at: string;
}

interface UseDirectMessagesResult {
  messages: DirectMessage[];
  loading: boolean;
  refetch: () => Promise<void>;
  fetchMore: () => Promise<void>;
  hasMore: boolean;
}

const PAGE_SIZE = 30;

export const useDirectMessages = (
  currentUserUuid: string,
  partnerUuid: string
): UseDirectMessagesResult => {
  // Always call all hooks
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const supabase = createClient();

  // For demo: derive a shared secret from both UUIDs (in production, use a secure key exchange)
  const sharedSecret =
    currentUserUuid < partnerUuid
      ? `${currentUserUuid}:${partnerUuid}`
      : `${partnerUuid}:${currentUserUuid}`;

  const fetchMessages = useCallback(
    async (pageOverride?: number) => {
      if (!currentUserUuid || !partnerUuid) {
        setMessages([]);
        setLoading(false);
        setHasMore(false);
        return;
      }
      setLoading(true);
      const orFilter = `and(sender_id.eq.${currentUserUuid},receiver_id.eq.${partnerUuid}),and(sender_id.eq.${partnerUuid},receiver_id.eq.${currentUserUuid})`;
      const pageToFetch = pageOverride ?? page;
      try {
        const { data, error } = await supabase
          .from("direct_messages")
          .select("*")
          .or(orFilter)
          .order("created_at", { ascending: true })
          .range(
            Math.max(0, pageToFetch * PAGE_SIZE - PAGE_SIZE),
            pageToFetch * PAGE_SIZE - 1
          );
        if (error) {
          console.error("[useDirectMessages] Supabase error:", error);
        }
        if (!error && data) {
          const decrypted = data.map((msg: any) => {
            let decryptedContent = "[Encrypted message]";
            if (
              msg.is_encrypted &&
              msg.encrypted_content &&
              msg.encryption_iv &&
              msg.encryption_salt
            ) {
              try {
                decryptedContent =
                  decryptMessage(
                    {
                      encryptedContent: msg.encrypted_content,
                      iv: msg.encryption_iv,
                      salt: msg.encryption_salt,
                    },
                    sharedSecret
                  ) || "[Encrypted message]";
              } catch {
                decryptedContent = "[Failed to decrypt message]";
              }
            }
            return {
              ...msg,
              // No content field
            };
          });
          setMessages((prev) => {
            // If fetching first page, replace; else, append
            if (pageToFetch === 1) return decrypted;
            // Avoid duplicates
            const existingIds = new Set(prev.map((m) => m.id));
            return [
              ...prev,
              ...decrypted.filter((m) => !existingIds.has(m.id)),
            ];
          });
          setHasMore(data.length === PAGE_SIZE);
        }
      } catch (err) {
        console.error("[useDirectMessages] Exception during fetch:", err);
      } finally {
        setLoading(false);
      }
    },
    [currentUserUuid, partnerUuid, supabase, sharedSecret, page]
  );

  // Fetch more (pagination)
  const fetchMore = useCallback(async () => {
    if (!hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchMessages(nextPage);
  }, [hasMore, page, fetchMessages]);

  useEffect(() => {
    if (!currentUserUuid || !partnerUuid) return;
    setPage(1);
    fetchMessages(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserUuid, partnerUuid]);

  useEffect(() => {
    if (!currentUserUuid || !partnerUuid) return;
    const channel = supabase
      .channel("direct_messages")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload: any) => {
          const msg = payload.new as DirectMessage;
          // Only add if it's for this chat
          const isRelevant =
            (msg.sender_id === currentUserUuid &&
              msg.receiver_id === partnerUuid) ||
            (msg.sender_id === partnerUuid &&
              msg.receiver_id === currentUserUuid);
          if (!isRelevant) return;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            // Ensure all are DirectMessage
            return [...prev, msg] as DirectMessage[];
          });
        }
      )
      .on(
        "postgres_changes" as any,
        { event: "UPDATE", schema: "public", table: "direct_messages" },
        fetchMessages
      )
      .on(
        "postgres_changes" as any,
        { event: "DELETE", schema: "public", table: "direct_messages" },
        fetchMessages
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserUuid, partnerUuid, fetchMessages, supabase]);

  // Return empty state if UUIDs are not set
  if (!currentUserUuid || !partnerUuid) {
    return {
      messages: [],
      loading: true,
      refetch: async () => {},
      fetchMore: async () => {},
      hasMore: false,
    };
  }

  return {
    messages,
    loading,
    refetch: () => fetchMessages(1),
    fetchMore,
    hasMore,
  };
};
