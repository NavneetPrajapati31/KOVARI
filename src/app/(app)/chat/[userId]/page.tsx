"use client";

import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  useLayoutEffect,
} from "react";
import React from "react";
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
  Smile,
  XCircle,
} from "lucide-react";
import { createClient } from "@/lib/supabase";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
import { encryptMessage, decryptMessage } from "@/shared/utils/encryption";
import Link from "next/link";
import { useToast } from "@/shared/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

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

// Extend DirectMessage for optimistic/failure status
interface LocalDirectMessage extends DirectMessage {
  status?: "sending" | "failed" | "sent";
  tempId?: string;
  plain_content?: string; // for optimistic UI
}

// Utility to format message with line breaks
const formatMessageWithLineBreaks = (message: string) =>
  message.replace(/\n/g, "<br />");

// Message skeleton for loading
const MessageSkeleton = () => (
  <div className="flex mb-0.5 justify-start">
    <div className="relative max-w-[75%] flex items-end gap-2">
      <div className="relative px-4 py-1.5 rounded-2xl bg-gray-200 animate-pulse w-32 h-6" />
    </div>
  </div>
);

// Memoized Message Row
const MessageRow = React.memo(
  ({
    msg,
    isSent,
    content,
    showSpinner,
    showError,
    onRetry,
    isListItem,
  }: {
    msg: LocalDirectMessage;
    isSent: boolean;
    content: string;
    showSpinner: boolean;
    showError: boolean;
    onRetry?: (msg: LocalDirectMessage) => void;
    isListItem?: boolean;
  }) => (
    <div
      key={msg.tempId || msg.id}
      className={`flex ${isSent ? "justify-end" : "justify-start"} mb-0.5`}
      {...(isListItem
        ? {
            role: "listitem",
            "aria-label": isSent ? "Sent message" : "Received message",
          }
        : {})}
    >
      <div
        className={`relative max-w-[75%] ${isSent ? "flex-row-reverse" : "flex-row"} flex items-end gap-2`}
      >
        <div
          className={`relative px-4 py-1.5 rounded-2xl text-xs sm:text-sm leading-relaxed break-words whitespace-pre-line ${
            isSent
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-gray-100 text-foreground rounded-bl-md"
          }`}
          tabIndex={0}
          aria-label={content}
          role="document"
        >
          {msg.status === "sending" || msg.status === "failed" ? (
            <span>{content}</span>
          ) : (
            <span
              dangerouslySetInnerHTML={{
                __html: formatMessageWithLineBreaks(content),
              }}
            />
          )}
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
            {showSpinner && <Loader2 className="w-3 h-3 animate-spin" />}
            {showError && (
              <>
                <XCircle className="w-3 h-3 text-red-500" />
                {onRetry && (
                  <button
                    className="ml-1 text-xs text-red-500 underline hover:text-red-700 focus:outline-none"
                    tabIndex={0}
                    aria-label="Retry sending message"
                    onClick={() => onRetry(msg)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onRetry(msg);
                      }
                    }}
                  >
                    Retry
                  </button>
                )}
              </>
            )}
            {isSent && !showSpinner && !showError && (
              <CheckCheck className="w-3 h-3" />
            )}
          </span>
        </div>
      </div>
    </div>
  )
);
MessageRow.displayName = "MessageRow";

// Memoized Message List
const MessageList = ({
  messages,
  currentUserUuid,
  sharedSecret,
  onRetry,
}: {
  messages: LocalDirectMessage[];
  currentUserUuid: string;
  sharedSecret: string;
  onRetry?: (msg: LocalDirectMessage) => void;
}) => {
  return (
    <>
      <div className="text-center mb-4">
        <span className="text-xs text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
          Today
        </span>
      </div>
      <div role="list">
        {messages.map((msg) => {
          const isSent = msg.sender_id === currentUserUuid;
          let content: string = "";
          let showSpinner = false;
          let showError = false;
          if (msg.status === "sending" || msg.status === "failed") {
            content = msg.plain_content || "";
            showSpinner = msg.status === "sending";
            showError = msg.status === "failed";
          } else {
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
            content = decryptedContent;
          }
          return (
            <MessageRow
              key={msg.tempId || msg.id}
              msg={msg}
              isSent={isSent}
              content={content}
              showSpinner={showSpinner}
              showError={showError}
              onRetry={onRetry}
              isListItem={true}
            />
          );
        })}
      </div>
    </>
  );
};

// Memoized Message Input with emoji-mart popover
const MessageInput = ({
  handleSend,
  sending,
}: {
  handleSend: (value: string, clearInput?: () => void) => void;
  sending: boolean;
}) => {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Insert emoji at cursor position
  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) return;
    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const value = input.value;
    const newValue = value.slice(0, start) + emoji + value.slice(end);
    setText(newValue);
    // Move cursor after emoji (next render)
    setTimeout(() => {
      input.setSelectionRange(start + emoji.length, start + emoji.length);
      input.focus();
    }, 0);
  };

  // Close emoji picker on outside click or Escape
  useEffect(() => {
    if (!showEmoji) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target as Node)
      ) {
        setShowEmoji(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowEmoji(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showEmoji]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        handleSend(text, () => setText(""));
      }
    }
  };

  return (
    <div className="flex items-center space-x-1 relative">
      <div className="flex-1 relative h-auto bg-transparent rounded-full hover:cursor-text">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Your message"
          className="w-full px-4 py-2 rounded-full border-none bg-transparent text-sm focus:outline-none"
          aria-label="Type your message"
          disabled={sending}
        />
      </div>
      <button
        ref={emojiButtonRef}
        type="button"
        className="rounded-full bg-transparent hover:bg-primary/10 text-primary flex items-center justify-center p-2 focus:outline-none focus:ring-0"
        aria-label="Open emoji picker"
        tabIndex={0}
        onClick={() => setShowEmoji((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowEmoji((v) => !v);
          }
        }}
      >
        <Smile className="h-5 w-5" />
      </button>
      {showEmoji && (
        <div
          ref={popoverRef}
          className="absolute bottom-12 right-0 z-50 bg-card border-none rounded-xl shadow-none p-2"
          role="dialog"
          aria-label="Emoji picker"
        >
          {/* @ts-ignore */}
          <Picker
            data={data}
            theme="light"
            previewPosition="none"
            skinTonePosition="search"
            emojiSet="apple"
            emojiButtonSize={32}
            emojiSize={24}
            onEmojiSelect={(emoji: any) => {
              insertEmoji(emoji.native);
              // DO NOT close popover after select
            }}
            style={{ width: "320px" }}
          />
        </div>
      )}
      <button
        onClick={() => {
          if (text.trim()) {
            handleSend(text, () => setText(""));
          }
        }}
        disabled={sending || !text.trim()}
        className="rounded-full bg-transparent hover:bg-primary/90 text-primary disabled:opacity-50 flex items-center justify-center hover:cursor-pointer pr-3"
        aria-label="Send message"
      >
        {sending ? (
          <Spinner variant="spinner" size="sm" color="primary" />
        ) : (
          <Send className="h-5 w-5" />
        )}
      </button>
    </div>
  );
};

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
  const { messages, loading, refetch, fetchMore, hasMore } = useDirectMessages(
    currentUserUuid,
    partnerUuid
  );
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const lastMessagesRef = useRef<DirectMessage[]>([]);
  const { toast } = useToast();
  const [optimisticMessages, setOptimisticMessages] = useState<
    LocalDirectMessage[]
  >([]);
  const [loadingMore, setLoadingMore] = useState(false);

  // Memoize sharedSecret
  const sharedSecret = useMemo(() => {
    if (!currentUserUuid || !partnerUuid) return "";
    return currentUserUuid < partnerUuid
      ? `${currentUserUuid}:${partnerUuid}`
      : `${partnerUuid}:${currentUserUuid}`;
  }, [currentUserUuid, partnerUuid]);

  // Memoize effectiveMessages
  const effectiveMessages = useMemo(
    () => (loading ? lastMessagesRef.current : messages),
    [loading, messages]
  );

  // Helper to merge and dedupe messages (optimistic first, then server)
  // Cast effectiveMessages to LocalDirectMessage[] so tempId is allowed
  const mergedMessages = useMemo(() => {
    const seen = new Set<string>();
    const all: LocalDirectMessage[] = [
      ...optimisticMessages,
      ...(effectiveMessages as LocalDirectMessage[]),
    ];
    return all.filter((msg) => {
      const id = msg.tempId || msg.id;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [optimisticMessages, effectiveMessages]);

  // Memoize handlers
  const handleBackClick = useCallback(() => {
    router.push("/chat");
  }, [router]);

  // Optimistic send
  const handleSend = useCallback(
    async (value: string, clearInput?: () => void) => {
      if (!value.trim() || !currentUserUuid || !partnerUuid) return;
      setError(null);
      // 1. Add optimistic message and clear input immediately
      const tempId = uuidv4();
      const optimisticMsg: LocalDirectMessage = {
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
      };
      setOptimisticMessages((prev) => [...prev, optimisticMsg]);
      if (clearInput) clearInput();
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
            },
          ])
          .select()
          .single();
        if (insertError || !data) {
          throw new Error(insertError?.message || "Failed to send message");
        }
        // 2. Replace optimistic with real message
        setOptimisticMessages((prev) =>
          prev.filter((msg) => msg.tempId !== tempId)
        );
        refetch(); // Server will provide the real message
      } catch (err: any) {
        // 3. Mark as failed
        setOptimisticMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...msg, status: "failed" } : msg
          )
        );
        setError(err.message || "Failed to send message");
        toast({
          title: "Message failed",
          description: err.message || "Failed to send message",
          variant: "destructive",
        });
      } finally {
        setSending(false);
      }
    },
    [currentUserUuid, partnerUuid, sharedSecret, supabase, refetch, toast]
  );

  // Infinite scroll: fetch more messages when scrolled to top
  const handleMessagesScroll = useCallback(async () => {
    const container = messagesContainerRef.current;
    if (!container || loadingMore || !hasMore) return;
    if (container.scrollTop < 32) {
      setLoadingMore(true);
      await fetchMore();
      setLoadingMore(false);
    }
  }, [fetchMore, loadingMore, hasMore]);

  // Scroll to bottom when messages change
  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [mergedMessages.length]);

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
    if (!loading && messages.length > 0) {
      lastMessagesRef.current = messages;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!loading && messages.length > 0) {
      setHasLoadedOnce(true);
    }
  }, [loading, messages.length]);

  // Retry handler for failed messages
  const handleRetry = useCallback(
    (msg: LocalDirectMessage) => {
      if (msg.plain_content) {
        // Remove the failed message before retrying
        setOptimisticMessages((prev) =>
          prev.filter((m) => m.tempId !== msg.tempId)
        );
        handleSend(msg.plain_content);
      }
    },
    [handleSend]
  );

  if (
    !isLoaded ||
    (!hasLoadedOnce &&
      loading &&
      messages.length === 0 &&
      effectiveMessages.length === 0 &&
      optimisticMessages.length === 0)
  ) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-2 w-full">
            {[...Array(6)].map((_, i) => (
              <MessageSkeleton key={i} />
            ))}
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
        className="absolute top-16 bottom-10 left-0 right-0 overflow-y-auto p-4 space-y-1 scrollbar-none bg-card"
        data-testid="messages-container"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions text"
        tabIndex={0}
        aria-label="Chat messages"
        onScroll={handleMessagesScroll}
      >
        {loadingMore && hasMore && (
          <div className="flex justify-center py-2">
            <Spinner variant="spinner" size="sm" color="primary" />
          </div>
        )}
        {mergedMessages.length === 0 ? (
          <div className="flex-1 h-full flex items-center justify-center text-center py-8">
            <span className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </span>
          </div>
        ) : (
          <MessageList
            messages={mergedMessages}
            currentUserUuid={currentUserUuid}
            sharedSecret={sharedSecret}
            onRetry={handleRetry}
          />
        )}
      </div>

      {/* Message Input - Always at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-1 shadow-none z-10">
        <MessageInput handleSend={handleSend} sending={sending} />
      </div>
    </div>
  );
};

export default DirectChatPage;
