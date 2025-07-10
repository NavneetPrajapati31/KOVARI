"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useDirectMessages } from "@/shared/hooks/use-direct-messages";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Image, Spinner } from "@heroui/react";
import {
  Send,
  Loader2,
  CheckCheck,
  EllipsisVertical,
  User,
  ArrowLeft,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
import { encryptMessage, decryptMessage } from "@/shared/utils/encryption";
import Link from "next/link";

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

interface PartnerProfile {
  name?: string;
  username?: string;
  profile_photo?: string;
}

const DirectChatPage = () => {
  const { user, isLoaded } = useUser();
  const params = useParams();
  const router = useRouter();
  const partnerUuid = params?.userId as string; // Now this is the UUID from the URL
  const currentUserId = user?.id || "";
  const [currentUserUuid, setCurrentUserUuid] = useState<string>("");
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(
    null
  );
  const { messages, loading, refetch } = useDirectMessages(
    currentUserUuid,
    partnerUuid
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // For demo: derive a shared secret from both UUIDs (in production, use a secure key exchange)
  const sharedSecret =
    currentUserUuid < partnerUuid
      ? `${currentUserUuid}:${partnerUuid}`
      : `${partnerUuid}:${currentUserUuid}`;

  useEffect(() => {
    const fetchUuid = async () => {
      if (!currentUserId) return;
      const uuid = await getUserUuidByClerkId(currentUserId);
      setCurrentUserUuid(uuid || "");
    };
    fetchUuid();
  }, [currentUserId]);

  useEffect(() => {
    if (!partnerUuid) return;
    const fetchPartnerProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("name, username, profile_photo")
        .eq("user_id", partnerUuid)
        .single();
      if (!error && data) setPartnerProfile(data);
    };
    fetchPartnerProfile();
  }, [partnerUuid, supabase]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  const handleBackClick = () => {
    router.push("/chat");
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !currentUserUuid || !partnerUuid) return;
    setSending(true);
    setError(null);
    try {
      // Encrypt the message before sending
      const encrypted = await encryptMessage(input.trim(), sharedSecret);
      const { error: insertError } = await supabase
        .from("direct_messages")
        .insert([
          {
            sender_id: currentUserUuid,
            receiver_id: partnerUuid,
            encrypted_content: encrypted.encryptedContent,
            encryption_iv: encrypted.iv,
            encryption_salt: encrypted.salt,
            is_encrypted: true,
          },
        ]);
      if (insertError) {
        throw new Error(insertError.message || "Failed to send message");
      }
      setInput("");
      refetch();
    } catch (err: any) {
      setError(err.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!isLoaded || loading || !currentUserUuid) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <Spinner variant="spinner" size="md" color="primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full bg-card">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 px-3 sm:px-5 py-3 border-b border-border bg-card z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Back button for mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackClick}
              className="md:hidden p-0 h-5 w-5 gap-0"
              aria-label="Back to inbox"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Link href={`/profile/${partnerUuid}`}>
              <div className="flex items-center gap-3">
                {partnerProfile?.profile_photo ? (
                  <Image
                    src={partnerProfile.profile_photo}
                    alt={
                      partnerProfile.name || partnerProfile.username || "User"
                    }
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold text-lg select-none">
                    {partnerProfile?.name?.[0]?.toUpperCase() ||
                      partnerProfile?.username?.[0]?.toUpperCase() || (
                        <User className="h-5 w-5" />
                      )}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-sm text-foreground">
                    {partnerProfile?.name || "Unknown User"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    @{partnerProfile?.username || ""}
                  </div>
                </div>
              </div>
            </Link>
          </div>
          <EllipsisVertical className="h-5 w-5" />
        </div>
      </div>

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="absolute top-16 bottom-12 left-0 right-0 overflow-y-auto p-4 space-y-1 scrollbar-none bg-card"
        data-testid="messages-container"
      >
        {messages.length === 0 ? (
          <div className="flex-1 h-full flex items-center justify-center text-center py-8">
            <span className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </span>
          </div>
        ) : (
          <>
            <div className="text-center mb-4">
              <span className="text-xs text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
                Today
              </span>
            </div>
            {messages.map((msg) => {
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
              const isSent = msg.sender_id === currentUserUuid;
              return (
                <div
                  key={msg.id}
                  className={`flex ${isSent ? "justify-end" : "justify-start"} mb-0.5`}
                >
                  <div
                    className={`relative max-w-[75%] ${isSent ? "flex-row-reverse" : "flex-row"} flex items-end gap-2`}
                  >
                    <div
                      className={`relative px-4 py-1.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words ${
                        isSent
                          ? "bg-primary text-primary-foreground rounded-br-md"
                          : "bg-gray-100 text-foreground rounded-bl-md"
                      }`}
                    >
                      <span>{decryptedContent}</span>
                      <span className="flex items-center gap-1 justify-end ml-3 mt-2.5 float-right">
                        <span
                          className={`text-[10px] ${
                            isSent ? "text-white/70" : "text-gray-500"
                          }`}
                        >
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isSent && <CheckCheck className="w-3 h-3" />}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Message Input - Always at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-3 py-2 shadow-none z-10">
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative h-8 bg-transparent rounded-full">
            <Input
              type="text"
              placeholder="Your message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="pr-12 h-8 rounded-full placeholder:text-gray-400 w-full bg-transparent border-none focus:ring-0 focus:outline-none text-sm px-4"
              aria-label="Message input"
              disabled={sending}
            />
          </div>
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="rounded-full bg-transparent hover:bg-primary/90 text-primary h-8 w-8 disabled:opacity-50"
            size="icon"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {error && <div className="text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
};

export default DirectChatPage;
