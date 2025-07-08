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
}

export const useDirectMessages = (
  currentUserUuid: string,
  partnerUuid: string
): UseDirectMessagesResult => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const supabase = createClient();

  // For demo: derive a shared secret from both UUIDs (in production, use a secure key exchange)
  const sharedSecret =
    currentUserUuid < partnerUuid
      ? `${currentUserUuid}:${partnerUuid}`
      : `${partnerUuid}:${currentUserUuid}`;

  const fetchMessages = useCallback(async () => {
    if (!currentUserUuid || !partnerUuid) {
      if (!currentUserUuid && !partnerUuid) {
        console.warn("[useDirectMessages] Skipping fetch: missing UUID(s)", {
          currentUserUuid,
          partnerUuid,
        });
      }
      setMessages([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const orFilter = `and(sender_id.eq.${currentUserUuid},receiver_id.eq.${partnerUuid}),and(sender_id.eq.${partnerUuid},receiver_id.eq.${currentUserUuid})`;
    console.log("[useDirectMessages] orFilter:", orFilter);
    try {
      const { data, error } = await supabase
        .from("direct_messages")
        .select("*")
        .or(orFilter)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("[useDirectMessages] Supabase error:", error);
      }
      if (!error && data) {
        // Decrypt messages if needed
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
        setMessages(decrypted);
      }
    } catch (err) {
      console.error("[useDirectMessages] Exception during fetch:", err);
    } finally {
      setLoading(false);
    }
  }, [currentUserUuid, partnerUuid, supabase, sharedSecret]);

  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("direct_messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "direct_messages" },
        fetchMessages
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchMessages, supabase]);

  return { messages, loading, refetch: fetchMessages };
};
