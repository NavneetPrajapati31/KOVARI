"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useDirectMessages } from "@/shared/hooks/use-direct-messages";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Send, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
import { encryptMessage, decryptMessage } from "@/shared/utils/encryption";

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
      console.log(
        "[DirectChatPage] Clerk ID:",
        currentUserId,
        "Mapped UUID:",
        uuid
      );
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
      <div className="max-w-full m-4 bg-card rounded-3xl shadow-none border border-border overflow-hidden">
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full m-4 bg-card rounded-3xl shadow-none border border-border overflow-hidden">
      <div className="flex h-[80vh]">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-border bg-transparent">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  {partnerProfile?.profile_photo && (
                    <img
                      src={partnerProfile.profile_photo}
                      alt={
                        partnerProfile.name || partnerProfile.username || "User"
                      }
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <div className="font-semibold text-foreground">
                      {partnerProfile?.name || "Unknown User"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{partnerProfile?.username || partnerUuid}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-none"
            data-testid="messages-container"
          >
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-sm text-muted-foreground">
                  No messages yet. Start the conversation!
                </span>
              </div>
            ) : (
              <>
                <div className="text-center">
                  <span className="text-sm text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
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
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === currentUserUuid ? "justify-end" : "justify-start"} mb-2`}
                    >
                      <div
                        className={`flex max-w-[75%] ${msg.sender_id === currentUserUuid ? "flex-row-reverse" : "flex-row"} items-end gap-3`}
                      >
                        <div
                          className={`flex flex-col ${msg.sender_id === currentUserUuid ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`px-4 py-3 rounded-2xl max-w-md ${
                              msg.sender_id === currentUserUuid
                                ? "bg-primary text-primary-foreground rounded-br-md"
                                : "bg-gray-100 text-foreground rounded-bl-md"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">
                              {decryptedContent}
                            </p>
                            <div className="flex items-center justify-end mt-2 gap-1 w-full">
                              <span
                                className={`text-xs ${msg.sender_id === currentUserUuid ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                              >
                                {new Date(msg.created_at).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Message Input - Sticky */}
          <div className="sticky bottom-0 left-0 right-0 z-10 bg-card border-t border-border p-4 shadow-none">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative h-10 bg-gray-100 rounded-full">
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
                  className="pr-12 h-10 rounded-full placeholder:text-gray-400 w-full bg-gray-100 border-none focus:ring-0 focus:outline-none text-sm px-4"
                  aria-label="Message input"
                  disabled={sending}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 disabled:opacity-50"
                size="icon"
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DirectChatPage;
