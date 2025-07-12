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
import { Avatar, Image, Spinner } from "@heroui/react";
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
  ChevronLeft,
} from "lucide-react";
import { BiCheckDouble, BiCheck } from "react-icons/bi";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
import { decryptMessage } from "@/shared/utils/encryption";
import Link from "next/link";
import { useToast } from "@/shared/hooks/use-toast";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
// import { useBlockStatus } from "@/shared/hooks/use-block-status";
import { useUserProfile } from "@/shared/hooks/use-user-profile";
import DirectChatSkeleton from "@/shared/components/layout/direct-chat-skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/shared/components/ui/dropdown-menu";
import ChatActionsDropdown from "@/shared/components/chat/chat-actions-dropdown";
import { isUserBlocked } from "@/shared/utils/blocked-users";
import { unblockUser } from "@/shared/utils/blocked-users";

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
      <div className="relative px-3 py-1 rounded-2xl bg-gray-200 animate-pulse w-32 h-6" />
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
    isSenderDeleted,
  }: {
    msg: any;
    isSent: boolean;
    content: string;
    showSpinner: boolean;
    showError: boolean;
    onRetry?: (msg: any) => void;
    isSenderDeleted?: boolean;
  }) => (
    <div
      className={`flex ${isSent ? "justify-end" : "justify-start"} mb-0.5`}
      aria-label={isSent ? "Sent message" : "Received message"}
    >
      <div
        className={`relative max-w-[75%] ${isSent ? "flex-row-reverse" : "flex-row"} flex items-end gap-2`}
      >
        <div
          className={`relative px-3 py-1 rounded-2xl text-xs sm:text-sm leading-relaxed break-words whitespace-pre-line ${
            isSent
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-gray-100 text-foreground rounded-bl-md"
          }`}
          tabIndex={0}
          aria-label={content}
          role="document"
        >
          {msg.status === "sending" || msg.status === "failed" ? (
            <span className="text-xs">{content}</span>
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
            {showSpinner && <BiCheck className="w-4 h-4 text-white/70" />}
            {showError && (
              <>
                <XCircle className="w-3 h-3 text-destructive" />
                {onRetry && (
                  <button
                    className="ml-1 text-xs text-destructive underline focus:outline-none"
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
            {isSent &&
              !showSpinner &&
              !showError &&
              (msg.read_at ? (
                <BiCheckDouble className="w-4 h-4 text-white/70" />
              ) : (
                <BiCheck className="w-4 h-4 text-white/70" />
              ))}
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

          // Check if sender is deleted
          const isSenderDeleted = msg.sender_profile?.deleted === true;

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
                isSenderDeleted={isSenderDeleted}
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
  disabled,
}: {
  handleSend: (value: string) => void;
  sending: boolean;
  disabled: boolean;
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
      <div className="flex-1 relative h-auto flex items-center bg-transparent hover:cursor-text">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Your message"
          className="w-full h-full px-4 py-3 rounded-none border-none bg-transparent text-xs focus:outline-none resize-none max-h-20 overflow-y-auto scrollbar-hide align-middle"
          aria-label="Type your message"
          disabled={sending || disabled}
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
        disabled={sending || !text.trim() || disabled}
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
  const {
    profile: partnerProfile,
    isDeleted: isPartnerDeleted,
    loading: partnerLoading,
  } = useUserProfile(partnerUuid);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const { toast } = useToast();
  const supabase = require("@/lib/supabase").createClient();
  const [iBlockedThem, setIBlockedThem] = useState(false);
  const [theyBlockedMe, setTheyBlockedMe] = useState(false);
  const [blockLoading, setBlockLoading] = useState(true);
  const [unblockError, setUnblockError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const checkBlocks = async () => {
      setBlockLoading(true);
      try {
        const [iBlocked, theyBlocked] = await Promise.all([
          isUserBlocked(currentUserUuid, partnerUuid),
          isUserBlocked(partnerUuid, currentUserUuid),
        ]);
        if (!cancelled) {
          setIBlockedThem(iBlocked);
          setTheyBlockedMe(theyBlocked);
        }
      } finally {
        if (!cancelled) setBlockLoading(false);
      }
    };
    if (currentUserUuid && partnerUuid) {
      checkBlocks();
    } else {
      setBlockLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [currentUserUuid, partnerUuid]);

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

  // Use the new direct chat hook
  const { messages, loading, sending, error, sendMessage, markMessagesRead } =
    useDirectChat(currentUserUuid, partnerUuid);

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

  // Mark messages as read when chat is opened or partnerUuid changes
  useEffect(() => {
    if (markMessagesRead) {
      markMessagesRead();
    }
  }, [partnerUuid, markMessagesRead]);

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

  const handleUnblock = async () => {
    setIsUnblocking(true);
    setUnblockError(null);
    try {
      await unblockUser(currentUserUuid, partnerUuid);
      setIBlockedThem(false); // local state update if you want to avoid reload
      toast({
        title: "User unblocked",
        description: "You can now chat with this user.",
        variant: "default",
      });
      // Optional: if you want to support a callback
      // if (onUnblocked) onUnblocked();
      // window.location.reload();
    } catch (e: any) {
      setUnblockError("Failed to unblock user");
      toast({
        title: "Failed to unblock user",
        description: e?.message || "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsUnblocking(false);
    }
  };

  if (
    blockLoading ||
    partnerLoading ||
    !currentUserUuid ||
    !partnerUuid ||
    (loading && messages.length === 0)
  ) {
    return <DirectChatSkeleton />;
  }
  if (iBlockedThem) {
    return (
      <div className="relative flex flex-col h-full items-center justify-center text-center p-3">
        <button
          onClick={handleBackClick}
          className="absolute top-4 left-3 bg-transparent text-foreground md:hidden p-0 gap-1 inline-flex items-center text-xs md:text-sm transition-colors"
          aria-label="Back to inbox"
        >
          <ChevronLeft className="md:h-4 md:w-4 h-3 w-3" />
          Back to Inbox
        </button>
        <span className="text-md font-semibold text-destructive mb-2">
          You have blocked this user.
        </span>
        <span className="text-sm text-muted-foreground">
          You cannot send or receive messages.
        </span>
        <button
          onClick={handleUnblock}
          disabled={isUnblocking}
          className="mt-4 py-1.5 px-4 rounded-lg bg-destructive text-primary-foreground text-sm font-semibold disabled:opacity-60 focus:outline-none focus:ring-0"
          aria-label="Unblock user"
        >
          {isUnblocking ? (
            <span className="flex items-center gap-2">
              <Spinner
                variant="spinner"
                size="sm"
                classNames={{ spinnerBars: "bg-primary-foreground" }}
              />
              Unblocking...
            </span>
          ) : (
            "Unblock User"
          )}
        </button>
      </div>
    );
  }
  if (theyBlockedMe) {
    return (
      <div className="relative flex flex-col h-full items-center justify-center text-center p-3">
        <button
          onClick={handleBackClick}
          className="absolute top-4 left-3 bg-transparent text-foreground md:hidden p-0 gap-1 inline-flex items-center text-xs md:text-sm transition-colors"
          aria-label="Back to inbox"
        >
          <ChevronLeft className="md:h-4 md:w-4 h-3 w-3" />
          Back to Inbox
        </button>
        <span className="text-md font-semibold text-destructive mb-2">
          You have been blocked by this user.
        </span>
        <span className="text-sm text-muted-foreground">
          You cannot send messages to this user.
        </span>
      </div>
    );
  }
  // Don't block access for deleted users - just show them as Anonymous
  // The chat will still be accessible and messages will be visible

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
                {isPartnerDeleted ? (
                  <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-semibold text-lg select-none">
                    <User className="h-5 w-5" />
                  </div>
                ) : partnerProfile?.profile_photo ? (
                  <Avatar
                    src={partnerProfile.profile_photo}
                    alt={
                      partnerProfile.name || partnerProfile.username || "User"
                    }
                    className="w-10 h-10"
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
                    {isPartnerDeleted
                      ? "Deleted User"
                      : partnerProfile?.name || "Unknown User"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {`@${partnerProfile?.username || ""}`}
                  </div>
                </div>
              </div>
            </Link>
          </div>
          {/* Dropdown menu for chat actions */}
          <ChatActionsDropdown
            currentUserUuid={currentUserUuid}
            partnerUuid={partnerUuid}
            disabled={iBlockedThem || theyBlockedMe}
            partnerProfile={partnerProfile || undefined}
          />
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
        <MessageInput
          handleSend={sendMessage}
          sending={sending}
          disabled={iBlockedThem || theyBlockedMe || isPartnerDeleted}
        />
      </div>
    </div>
  );
};

export default DirectChatPage;
