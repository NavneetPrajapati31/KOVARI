import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { decryptMessage } from "@/shared/utils/encryption";

export interface Conversation {
  userId: string; // UUID
  lastMessage: string;
  lastMessageAt: string;
}

interface UseDirectInboxResult {
  conversations: Conversation[];
  loading: boolean;
}

export const useDirectInbox = (
  currentUserUuid: string
): UseDirectInboxResult => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const supabase = createClient();

  useEffect(() => {
    if (!currentUserUuid) {
      setConversations([]);
      setLoading(false);
      return;
    }
    const fetchInbox = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("direct_messages")
        .select(
          "id, encrypted_content, encryption_iv, encryption_salt, is_encrypted, created_at, sender_id, receiver_id"
        )
        .or(`sender_id.eq.${currentUserUuid},receiver_id.eq.${currentUserUuid}`)
        .order("created_at", { ascending: false });
      if (!error && data) {
        const map = new Map<string, Conversation>();
        data.forEach((msg: any) => {
          const partnerId =
            msg.sender_id === currentUserUuid ? msg.receiver_id : msg.sender_id;
          if (partnerId && !map.has(partnerId)) {
            // Derive shared secret
            const sharedSecret =
              currentUserUuid < partnerId
                ? `${currentUserUuid}:${partnerId}`
                : `${partnerId}:${currentUserUuid}`;
            console.log("[Inbox Decrypt] partnerId:", partnerId, {
              sharedSecret,
              encrypted_content: msg.encrypted_content,
              encryption_iv: msg.encryption_iv,
              encryption_salt: msg.encryption_salt,
            });
            let lastMessage = "[Encrypted message]";
            if (
              msg.is_encrypted &&
              msg.encrypted_content &&
              msg.encryption_iv &&
              msg.encryption_salt
            ) {
              try {
                lastMessage =
                  decryptMessage(
                    {
                      encryptedContent: msg.encrypted_content,
                      iv: msg.encryption_iv,
                      salt: msg.encryption_salt,
                    },
                    sharedSecret
                  ) || "[Encrypted message]";
              } catch {
                lastMessage = "[Failed to decrypt message]";
              }
            }
            map.set(partnerId, {
              userId: partnerId,
              lastMessage,
              lastMessageAt: msg.created_at,
            });
          }
        });
        setConversations(Array.from(map.values()));
      }
      setLoading(false);
    };
    fetchInbox();
  }, [currentUserUuid, supabase]);

  return { conversations, loading };
};
