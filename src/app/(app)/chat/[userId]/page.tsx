"use client";

import React, {
  useRef,
  useEffect,
  useMemo,
  useLayoutEffect,
  useState,
} from "react";
import { useUser } from "@clerk/nextjs";
import { useParams, useRouter } from "next/navigation";
import { useDirectChat } from "@/shared/hooks/useDirectChat";
import { useDirectInbox } from "@/shared/hooks/use-direct-inbox";
import { Button } from "@/shared/components/ui/button";
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
  Check,
} from "lucide-react";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
import { decryptMessage } from "@/shared/utils/encryption";
import Link from "next/link";
import { useToast } from "@/shared/hooks/use-toast";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";

interface PartnerProfile {
  name?: string;
  username?: string;
  profile_photo?: string;
}

const formatMessageWithLineBreaks = (message: string) =>
  message.replace(/\n/g, "<br />");

const MessageSkeleton = () => (
  <div className="flex mb-0.5 justify-start">
    <div className="relative max-w-[75%] flex items-end gap-2">
      <div className="relative px-4 py-1.5 rounded-2xl bg-gray-200 animate-pulse w-32 h-6" />
    </div>
  </div>
);

const MessageRow = React.memo(
  ({
    msg,
    isSent,
    content,
    showSpinner,
    showError,
    onRetry,
  }: {
    msg: any;
    isSent: boolean;
    content: string;
    showSpinner: boolean;
    showError: boolean;
    onRetry?: (msg: any) => void;
  }) => (
    <div
      className={`flex ${isSent ? "justify-end" : "justify-start"} mb-0.5`}
      aria-label={isSent ? "Sent message" : "Received message"}
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
              className="text-xs"
              dangerouslySetInnerHTML={{
                __html: formatMessageWithLineBreaks(content),
              }}
            />
          )}
          <span className="flex items-center gap-1 justify-end ml-3 mt-2 float-right">
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
            {showSpinner && <Check className="w-3 h-3" />}
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

const MessageList = ({
  messages,
  currentUserUuid,
  sharedSecret,
  onRetry,
}: {
  messages: any[];
  currentUserUuid: string;
  sharedSecret: string;
  onRetry?: (msg: any) => void;
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
            <div role="listitem" key={msg.tempId || msg.id}>
              <MessageRow
                msg={msg}
                isSent={isSent}
                content={content}
                showSpinner={showSpinner}
                showError={showError}
                onRetry={onRetry}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};

const MessageInput = ({
  handleSend,
  sending,
}: {
  handleSend: (value: string) => void;
  sending: boolean;
}) => {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [text]);

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const value = textarea.value;
    const newValue = value.slice(0, start) + emoji + value.slice(end);
    setText(newValue);
    setTimeout(() => {
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      textarea.focus();
    }, 0);
  };

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (text.trim()) {
        handleSend(text);
        setText("");
      }
    }
  };

  return (
    <div className="flex items-center space-x-1 relative">
      <div className="flex-1 relative h-auto bg-transparent rounded-full hover:cursor-text">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Your message"
          className="w-full px-4 py-2 rounded-full border-none bg-transparent text-sm focus:outline-none resize-none min-h-[40px] max-h-40 overflow-y-auto"
          aria-label="Type your message"
          disabled={sending}
          rows={1}
          tabIndex={0}
          style={{ lineHeight: "1.5" }}
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
        onMouseEnter={() => {
          if (hoverTimeout) clearTimeout(hoverTimeout);
          setShowEmoji(true);
        }}
        onMouseLeave={() => {
          const timeout = setTimeout(() => setShowEmoji(false), 150);
          setHoverTimeout(timeout);
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
          onMouseEnter={() => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
          }}
          onMouseLeave={() => {
            const timeout = setTimeout(() => setShowEmoji(false), 150);
            setHoverTimeout(timeout);
          }}
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
            }}
            style={{ width: "320px" }}
          />
        </div>
      )}
      <button
        onClick={() => {
          if (text.trim()) {
            handleSend(text);
            setText("");
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
  const partnerUuid = params?.userId as string;
  const currentUserId = user?.id || "";
  // Cache currentUserUuid in localStorage for instant access
  const [currentUserUuid, setCurrentUserUuid] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("currentUserUuid") || "";
    }
    return "";
  });
  // Debug log for user IDs
  useEffect(() => {
    console.log("[DEBUG] Clerk user:", user);
    console.log("[DEBUG] currentUserId:", currentUserId);
    console.log("[DEBUG] currentUserUuid:", currentUserUuid);
    console.log("[DEBUG] partnerUuid:", partnerUuid);
  }, [user, currentUserId, currentUserUuid, partnerUuid]);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(
    null
  );
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const supabase = require("@/lib/supabase").createClient();

  useEffect(() => {
    if (!currentUserId) return;
    const fetchUuid = async () => {
      const uuid = await getUserUuidByClerkId(currentUserId);
      setCurrentUserUuid(uuid || "");
      if (uuid && typeof window !== "undefined") {
        localStorage.setItem("currentUserUuid", uuid);
      }
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

  // Use the new direct chat hook
  const { messages, loading, sending, error, sendMessage } = useDirectChat(
    currentUserUuid,
    partnerUuid
  );

  // Memoize sharedSecret
  const sharedSecret = useMemo(() => {
    if (!currentUserUuid || !partnerUuid) return "";
    return currentUserUuid < partnerUuid
      ? `${currentUserUuid}:${partnerUuid}`
      : `${partnerUuid}:${currentUserUuid}`;
  }, [currentUserUuid, partnerUuid]);

  // Use the inbox hook to get markConversationRead
  const { markConversationRead } = useDirectInbox(currentUserUuid, partnerUuid);

  // Scroll to bottom on new message
  const lastMessageId =
    messages.length > 0
      ? messages[messages.length - 1].tempId || messages[messages.length - 1].id
      : null;

  useLayoutEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [lastMessageId]);

  // Error toast
  useEffect(() => {
    if (error) {
      toast({
        title: "Message failed",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Retry handler for failed messages
  const handleRetry = (msg: any) => {
    if (msg.plain_content) {
      sendMessage(msg.plain_content);
    }
  };

  // Helper to get displayable message content
  const getDisplayableContent = (msg: any) => {
    if (msg.status === "sending" || msg.status === "failed") {
      return msg.plain_content || "";
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
      return decryptedContent;
    }
  };

  // Dispatch event after sending or receiving a message
  useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg) return;
    window.dispatchEvent(
      new CustomEvent("inbox-message-update", {
        detail: {
          partnerId: partnerUuid,
          message: getDisplayableContent(lastMsg),
          createdAt: lastMsg.created_at,
        },
      })
    );
  }, [messages, partnerUuid, sharedSecret]);

  const handleBackClick = () => {
    router.push("/chat");
  };

  // On unmount, mark conversation as read (for mobile/back nav)
  useEffect(() => {
    return () => {
      if (partnerUuid && markConversationRead) {
        markConversationRead(partnerUuid);
      }
    };
  }, [partnerUuid, markConversationRead]);

  if (!currentUserUuid || !partnerUuid || (loading && messages.length === 0)) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center">
          <div
            className="flex flex-col items-center space-y-2 w-full"
            role="list"
          >
            {[...Array(6)].map((_, i) => (
              <div role="listitem" key={i}>
                <MessageSkeleton />
              </div>
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
            <button
              onClick={handleBackClick}
              className="bg-transparent text-foreground md:hidden p-0 h-5 w-5 gap-0"
              aria-label="Back to inbox"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
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
        className="absolute top-16 bottom-10 left-0 right-0 overflow-y-auto p-4 mb-2 max-h-[80vh] space-y-1 scrollbar-none bg-card"
        data-testid="messages-container"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions text"
        tabIndex={0}
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex-1 h-full flex items-center justify-center text-center py-8">
            <span className="text-sm text-muted-foreground">
              No messages yet. Start the conversation!
            </span>
          </div>
        ) : (
          <MessageList
            messages={messages}
            currentUserUuid={currentUserUuid}
            sharedSecret={sharedSecret}
            onRetry={handleRetry}
          />
        )}
      </div>

      {/* Message Input - Always at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-1 shadow-none z-10">
        <MessageInput handleSend={sendMessage} sending={sending} />
      </div>
    </div>
  );
};

export default DirectChatPage;
