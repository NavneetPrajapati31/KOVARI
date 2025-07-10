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
}

export interface UseDirectChatResult {
  messages: DirectChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  sendMessage: (value: string) => Promise<void>;
}

export const useDirectChat = (
  currentUserUuid: string,
  partnerUuid: string
): UseDirectChatResult => {
  const [messages, setMessages] = useState<DirectChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const isMounted = useRef(true);

  // Shared secret for encryption
  const sharedSecret =
    currentUserUuid < partnerUuid
      ? `${currentUserUuid}:${partnerUuid}`
      : `${partnerUuid}:${currentUserUuid}`;

  // Fetch initial messages
  const fetchMessages = useCallback(async () => {
    if (!currentUserUuid || !partnerUuid) {
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const orFilter = `and(sender_id.eq.${currentUserUuid},receiver_id.eq.${partnerUuid}),and(sender_id.eq.${partnerUuid},receiver_id.eq.${currentUserUuid})`;
    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(orFilter)
        .order("created_at", { ascending: true });
      if (error) {
        setError(error.message);
        setMessages([]);
      } else if (data) {
        setMessages(data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch messages");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserUuid, partnerUuid, supabase]);

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
      setMessages((prev) => [...prev, optimisticMsg]);
      setSending(true);
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

  // Real-time subscription
  useEffect(() => {
    isMounted.current = true;
    if (!currentUserUuid || !partnerUuid) return;
    const channel = supabase
      .channel("direct_messages")
      .on(
        "postgres_changes" as any,
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload: any) => {
          const msg = payload.new as DirectChatMessage;
          // Only add if it's for this chat
          const isRelevant =
            (msg.sender_id === currentUserUuid &&
              msg.receiver_id === partnerUuid) ||
            (msg.sender_id === partnerUuid &&
              msg.receiver_id === currentUserUuid);
          if (!isRelevant) return;
          setMessages((prev) => {
            // Remove optimistic message if client_id matches
            const filtered = prev.filter((optimisticMsg) => {
              if (!optimisticMsg.client_id) return true;
              return optimisticMsg.client_id !== msg.client_id;
            });
            // Add the real message if not already present
            if (filtered.some((m) => m.id === msg.id)) return filtered;
            return [...filtered, msg];
          });
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

  return {
    messages,
    loading,
    sending,
    error,
    sendMessage,
  };
};
