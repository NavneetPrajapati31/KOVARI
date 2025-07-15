"use client";

import React, {
  useRef,
  useEffect,
  useMemo,
  useLayoutEffect,
  useState,
  useCallback,
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
  ChevronUp,
} from "lucide-react";
import { PiPaperclip } from "react-icons/pi";
import { BiCheckDouble, BiCheck } from "react-icons/bi";
import { HiPlay } from "react-icons/hi";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
import { decryptMessage } from "@/shared/utils/encryption";
import {
  formatMessageDate,
  isSameDay,
  linkifyMessage,
} from "@/shared/utils/utils";
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
import { Skeleton } from "@heroui/react";
import MediaViewerModal from "@/shared/components/media-viewer-modal";

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

// MediaWithSkeleton component (copied from group chat)
const MediaWithSkeleton = ({
  url,
  timestamp,
}: {
  url: string;
  timestamp: string;
}) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-40 h-32 md:w-60 md:h-44 lg:w-80 lg:h-60 max-w-full">
      {!loaded && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-2xl" />
      )}
      <img
        src={url}
        alt="sent media"
        className={`w-full h-full object-cover rounded-2xl ${loaded ? "" : "invisible"}`}
        onLoad={() => setLoaded(true)}
      />
      <span className="absolute bottom-2 right-2 bg-black/50 text-primary-foreground text-[10px] px-2 py-0.5 rounded-md">
        {timestamp}
      </span>
    </div>
  );
};

// VideoWithSkeleton component (copied from group chat)
const VideoWithSkeleton = ({
  url,
  timestamp,
}: {
  url: string;
  timestamp: string;
}) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-40 h-32 md:w-60 md:h-44 lg:w-80 lg:h-60 max-w-full">
      {!loaded && (
        <Skeleton className="absolute inset-0 w-full h-full rounded-2xl" />
      )}
      <video
        src={url}
        controls={false}
        className={`w-full h-full object-cover rounded-2xl ${loaded ? "" : "invisible"}`}
        onLoadedData={() => setLoaded(true)}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
        <HiPlay className="h-7 w-7 text-primary-foreground" />
      </div>
      <span className="absolute bottom-2 right-2 bg-black/50 text-primary-foreground text-[10px] px-2 py-0.5 rounded-md">
        {timestamp}
      </span>
    </div>
  );
};

// Utility: Check if message content is real text (not empty, not placeholder)
const isRealTextMessage = (content: string) => {
  if (!content) return false;
  const trimmed = content.trim();
  return trimmed !== "" && trimmed !== "[Encrypted message]";
};

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
  }) => {
    const hasMedia = !!msg.mediaUrl;
    const hasText = isRealTextMessage(content);
    const timeString = new Date(msg.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Any media: show only media card (no bubble)
    if (hasMedia && msg.mediaType === "image") {
      return (
        <div
          className={`flex ${isSent ? "justify-end" : "justify-start"} mb-1`}
        >
          <MediaWithSkeleton url={msg.mediaUrl} timestamp={timeString} />
        </div>
      );
    }
    if (hasMedia && msg.mediaType === "video") {
      return (
        <div
          className={`flex ${isSent ? "justify-end" : "justify-start"} mb-1`}
        >
          <VideoWithSkeleton url={msg.mediaUrl} timestamp={timeString} />
        </div>
      );
    }

    // Only text: show bubble
    if (hasText) {
      return (
        <div
          className={`flex ${isSent ? "justify-end" : "justify-start"} mb-1`}
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
                    __html: linkifyMessage(content),
                  }}
                />
              )}
              <span className="flex items-center gap-1 justify-end ml-3 mt-2 float-right">
                <span
                  className={`text-[10px] ${
                    isSent ? "text-white/70" : "text-gray-500"
                  }`}
                >
                  {timeString}
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
      );
    }
    // If neither media nor real text, render nothing
    return null;
  }
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
  // Group messages by date and add date separators
  const messagesWithSeparators = useMemo(() => {
    const result: Array<{
      type: "message" | "separator";
      data: any;
      date?: string;
    }> = [];

    messages.forEach((msg, index) => {
      const messageDate = msg.created_at;

      // Debug logging
      console.log(`Message ${index}:`, {
        date: messageDate,
        formatted: formatMessageDate(messageDate),
        parsed: new Date(messageDate).toLocaleString(),
      });

      // Add date separator if this is the first message or if the date changed
      if (
        index === 0 ||
        !isSameDay(messageDate, messages[index - 1].created_at)
      ) {
        result.push({
          type: "separator",
          data: { date: messageDate },
          date: messageDate,
        });
      }

      result.push({
        type: "message",
        data: msg,
      });
    });

    return result;
  }, [messages]);

  // Handle empty messages case
  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <span className="text-sm text-muted-foreground">
            No messages yet. Start a conversation!
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div role="list">
        {messagesWithSeparators.map((item, index) => {
          if (item.type === "separator") {
            return (
              <div key={`separator-${item.date}`} className="text-center my-4">
                <span className="text-xs text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
                  {formatMessageDate(item.date!)}
                </span>
              </div>
            );
          }

          const msg = item.data;
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
  currentUserUuid,
  partnerUuid,
}: {
  handleSend: (
    value: string,
    mediaUrl?: string,
    mediaType?: string
  ) => Promise<void>;
  sending: boolean;
  disabled: boolean;
  currentUserUuid: string;
  partnerUuid: string;
}) => {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploaded_by", currentUserUuid);
      formData.append("receiver_id", partnerUuid);
      const res = await fetch(`/api/direct-chat/media`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error("Failed to upload file");
      }
      const uploaded = await res.json();
      handleSend("", uploaded.url, uploaded.type);
    } catch (err) {
      // @ts-ignore
      if (window?.toast) window.toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex items-center space-x-1 relative">
      <button
        type="button"
        className="rounded-full bg-transparent hover:bg-primary/10 text-primary flex items-center justify-center p-2 focus:outline-none focus:ring-0"
        aria-label="Attach photo or video"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading || sending || disabled}
      >
        {/* {isUploading ? (
          <Spinner variant="spinner" size="sm" color="primary" />
        ) : ( */}
        <PiPaperclip className="h-5 w-5" />
        {/* )} */}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={handleFileChange}
        aria-label="Attach photo or video"
      />
      <div className="flex-1 relative h-auto flex items-center bg-transparent hover:cursor-text">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          placeholder="Your message"
          className="w-full h-full px-0 py-3 rounded-none border-none bg-transparent text-xs focus:outline-none resize-none max-h-10 overflow-y-auto scrollbar-hide align-middle"
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
  // Modal state for media viewer
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMediaUrl, setModalMediaUrl] = useState<string | null>(null);
  const [modalMediaType, setModalMediaType] = useState<
    "image" | "video" | null
  >(null);
  const [modalTimestamp, setModalTimestamp] = useState<string | undefined>(
    undefined
  );
  const [modalSender, setModalSender] = useState<string | undefined>(undefined);

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
    // --- Real-time block status subscription ---
    let subscription: any = null;
    if (currentUserUuid && partnerUuid && supabase?.channel) {
      subscription = supabase
        .channel("user-blocks")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "blocked_users" },
          (payload: any) => {
            // If the block/unblock event involves the current user and partner
            const newRow = payload.new || {};
            const oldRow = payload.old || {};
            if (
              (newRow.blocker_id === partnerUuid &&
                newRow.blocked_id === currentUserUuid) ||
              (newRow.blocker_id === currentUserUuid &&
                newRow.blocked_id === partnerUuid) ||
              (oldRow.blocker_id === partnerUuid &&
                oldRow.blocked_id === currentUserUuid) ||
              (oldRow.blocker_id === currentUserUuid &&
                oldRow.blocked_id === partnerUuid)
            ) {
              checkBlocks();
            }
          }
        )
        .subscribe();
    }
    return () => {
      cancelled = true;
      if (subscription && supabase?.removeChannel) {
        supabase.removeChannel(subscription);
      }
    };
  }, [currentUserUuid, partnerUuid, supabase]);

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
  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    markMessagesRead,
    loadMoreMessages,
    hasMoreMessages,
    loadingMore,
  } = useDirectChat(currentUserUuid, partnerUuid);

  // Memoize sharedSecret
  const sharedSecret = useMemo(() => {
    if (!currentUserUuid || !partnerUuid) return "";
    return currentUserUuid < partnerUuid
      ? `${currentUserUuid}:${partnerUuid}`
      : `${partnerUuid}:${currentUserUuid}`;
  }, [currentUserUuid, partnerUuid]);

  // Use the inbox hook to get markConversationRead
  const { markConversationRead } = useDirectInbox(currentUserUuid, partnerUuid);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      // Use requestAnimationFrame for smooth scrolling
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
      // Additional scroll after a frame to ensure it works
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      });
    }
  }, []);

  // Track if we're loading more messages to prevent scroll to bottom
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Update loading more state when loadingMore changes
  useEffect(() => {
    setIsLoadingMore(loadingMore);
  }, [loadingMore]);

  // Scroll to bottom on new messages and initial load
  const lastMessageId =
    messages.length > 0
      ? messages[messages.length - 1].tempId || messages[messages.length - 1].id
      : null;

  // Consolidated scroll effect for all scenarios
  useLayoutEffect(() => {
    // Don't scroll to bottom if we're loading more messages
    if (!isLoadingMore && messages.length > 0) {
      scrollToBottom();
    }
  }, [lastMessageId, messages.length, isLoadingMore, scrollToBottom]);

  // Scroll trigger for initial load completion and chat switching
  useEffect(() => {
    // Don't scroll to bottom if we're loading more messages
    if (!loading && !isLoadingMore && messages.length > 0) {
      // Small delay to ensure all content is rendered
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [loading, isLoadingMore, messages.length, scrollToBottom]);

  // Force scroll to bottom when partnerUuid changes (chat switching)
  useEffect(() => {
    if (partnerUuid && messages.length > 0 && !loading && !isLoadingMore) {
      // Immediate scroll for chat switching
      scrollToBottom();
      // Additional scroll after a short delay to ensure content is rendered
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [partnerUuid, messages.length, loading, isLoadingMore, scrollToBottom]);

  // Additional scroll trigger specifically for chat switching
  useEffect(() => {
    if (partnerUuid && !loading && !isLoadingMore) {
      // When switching chats, wait for messages to load and then scroll
      const timer = setTimeout(() => {
        if (messages.length > 0) {
          scrollToBottom();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [partnerUuid, loading, isLoadingMore, messages.length, scrollToBottom]);

  // Scroll trigger for when loading completes after chat switch
  useEffect(() => {
    // When loading transitions from true to false and we have messages, scroll to bottom
    if (!loading && !isLoadingMore && messages.length > 0) {
      // Use a longer delay to ensure all content is fully rendered
      const timer = setTimeout(() => {
        scrollToBottom();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [loading, isLoadingMore, messages.length, scrollToBottom]);

  // Track previous loading state to detect transitions
  const prevLoadingRef = useRef(loading);
  useEffect(() => {
    // Debug logging for chat switching
    console.log("[DEBUG] Loading state:", {
      prevLoading: prevLoadingRef.current,
      currentLoading: loading,
      isLoadingMore,
      messagesLength: messages.length,
      partnerUuid,
    });

    // If loading just finished (transitioned from true to false) and we have messages
    if (
      prevLoadingRef.current &&
      !loading &&
      !isLoadingMore &&
      messages.length > 0
    ) {
      console.log("[DEBUG] Loading finished, scrolling to bottom");
      // Immediate scroll
      scrollToBottom();
      // Additional scroll after delay to ensure content is rendered
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
    prevLoadingRef.current = loading;
  }, [loading, isLoadingMore, messages.length, scrollToBottom, partnerUuid]);

  // Direct scroll trigger for partnerUuid changes
  useEffect(() => {
    if (partnerUuid) {
      console.log("[DEBUG] Partner UUID changed to:", partnerUuid);
      // Wait for loading to complete and messages to be available
      const checkAndScroll = () => {
        if (!loading && !isLoadingMore && messages.length > 0) {
          console.log("[DEBUG] Conditions met, scrolling to bottom");
          scrollToBottom();
          return true; // Stop checking
        }
        return false; // Keep checking
      };

      // Try immediately
      if (!checkAndScroll()) {
        // If not ready, set up polling
        const interval = setInterval(() => {
          if (checkAndScroll()) {
            clearInterval(interval);
          }
        }, 50); // Check every 50ms

        // Cleanup after 2 seconds
        setTimeout(() => {
          clearInterval(interval);
        }, 2000);
      }
    }
  }, [partnerUuid, loading, isLoadingMore, messages.length, scrollToBottom]);

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
      sendMessage(msg.plain_content, msg.mediaUrl, msg.mediaType);
    }
  };

  // Helper to get displayable message content
  const getDisplayableContent = (msg: any) => {
    // If media, do not try to decrypt or show text
    if (msg.mediaUrl) return "";
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
          mediaType: lastMsg.mediaType || "",
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

  // Helper to get sender display name
  const getSenderName = (msg: any) => {
    if (msg.sender_profile?.name) return msg.sender_profile.name;
    if (msg.sender_profile?.username) return msg.sender_profile.username;
    if (msg.sender_id === currentUserUuid) return "You";
    return "Unknown";
  };

  // Patch MessageRow to support modal opening for media
  const PatchedMessageRow = React.memo(
    ({
      msg,
      isSent,
      content,
      showSpinner,
      showError,
      onRetry,
      isSenderDeleted,
    }: any) => {
      const hasMedia = !!msg.mediaUrl;
      const hasText = isRealTextMessage(content);
      const senderName = getSenderName(msg);
      // Any media: show only media card (no bubble)
      if (hasMedia && msg.mediaType === "image") {
        return (
          <div
            className={`flex ${isSent ? "justify-end" : "justify-start"} mb-1`}
          >
            <button
              type="button"
              className="overflow-hidden rounded-2xl focus:outline-none focus:ring-0"
              aria-label="View image in full screen"
              tabIndex={0}
              onClick={() => {
                setModalMediaUrl(msg.mediaUrl);
                setModalMediaType("image");
                setModalTimestamp(msg.created_at);
                setModalSender(senderName);
                setModalOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setModalMediaUrl(msg.mediaUrl);
                  setModalMediaType("image");
                  setModalTimestamp(msg.created_at);
                  setModalSender(senderName);
                  setModalOpen(true);
                }
              }}
            >
              <MediaWithSkeleton url={msg.mediaUrl} timestamp={msg.timestamp} />
            </button>
          </div>
        );
      }
      if (hasMedia && msg.mediaType === "video") {
        return (
          <div
            className={`flex ${isSent ? "justify-end" : "justify-start"} mb-1`}
          >
            <button
              type="button"
              className="overflow-hidden rounded-2xl focus:outline-none focus:ring-0"
              aria-label="View video in full screen"
              tabIndex={0}
              onClick={() => {
                setModalMediaUrl(msg.mediaUrl);
                setModalMediaType("video");
                setModalTimestamp(msg.created_at);
                setModalSender(senderName);
                setModalOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setModalMediaUrl(msg.mediaUrl);
                  setModalMediaType("video");
                  setModalTimestamp(msg.created_at);
                  setModalSender(senderName);
                  setModalOpen(true);
                }
              }}
            >
              <VideoWithSkeleton url={msg.mediaUrl} timestamp={msg.timestamp} />
            </button>
          </div>
        );
      }
      // Only text: show bubble
      if (hasText) {
        return (
          <MessageRow
            msg={msg}
            isSent={isSent}
            content={content}
            showSpinner={showSpinner}
            showError={showError}
            onRetry={onRetry}
            isSenderDeleted={isSenderDeleted}
          />
        );
      }
      return null;
    }
  );
  PatchedMessageRow.displayName = "PatchedMessageRow";

  // Patch MessageList to use PatchedMessageRow
  const PatchedMessageList = (props: any) => {
    const { messages, currentUserUuid, sharedSecret, onRetry } = props;
    const messagesWithSeparators = useMemo(() => {
      const result: Array<{
        type: "message" | "separator";
        data: any;
        date?: string;
      }> = [];
      messages.forEach((msg: any, index: number) => {
        const messageDate = msg.created_at;
        if (
          index === 0 ||
          !isSameDay(messageDate, messages[index - 1].created_at)
        ) {
          result.push({
            type: "separator",
            data: { date: messageDate },
            date: messageDate,
          });
        }
        result.push({ type: "message", data: msg });
      });
      return result;
    }, [messages]);
    if (messages.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <span className="text-sm text-muted-foreground">
              No messages yet. Start a conversation!
            </span>
          </div>
        </div>
      );
    }
    return (
      <>
        <div role="list">
          {messagesWithSeparators.map((item, index) => {
            if (item.type === "separator") {
              return (
                <div
                  key={`separator-${item.date}`}
                  className="text-center my-4"
                >
                  <span className="text-xs text-muted-foreground bg-gray-100 px-3 py-1 rounded-full">
                    {formatMessageDate(item.date!)}
                  </span>
                </div>
              );
            }
            const msg = item.data;
            const isSent = msg.sender_id === currentUserUuid;
            let content: string = "";
            let showSpinner = false;
            let showError = false;
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
                <PatchedMessageRow
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
        className="absolute top-16 bottom-8 left-0 right-0 overflow-y-auto scrollbar-hide p-4 mb-2 max-h-[80vh] bg-card flex flex-col"
        data-testid="messages-container"
        aria-live="polite"
        aria-atomic="false"
        aria-relevant="additions text"
        tabIndex={0}
        aria-label="Chat messages"
      >
        {hasMoreMessages && (
          <div className="flex justify-center py-2">
            <button
              onClick={loadMoreMessages}
              disabled={loadingMore}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              aria-label="Load more messages"
            >
              {loadingMore ? (
                <>
                  <Spinner
                    variant="spinner"
                    size="sm"
                    classNames={{ spinnerBars: "bg-black" }}
                  />
                  Loading more messages...
                </>
              ) : (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Load more messages
                </>
              )}
            </button>
          </div>
        )}
        <div className="flex-grow" />
        <PatchedMessageList
          messages={messages}
          currentUserUuid={currentUserUuid}
          sharedSecret={sharedSecret}
          onRetry={handleRetry}
        />
      </div>

      {/* Message Input - Always at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 bg-card border-t border-border px-2 py-1 shadow-none z-10">
        <MessageInput
          handleSend={async (
            value: string,
            mediaUrl?: string,
            mediaType?: string
          ) => {
            // Always check latest block status before sending
            const [iBlocked, theyBlocked] = await Promise.all([
              isUserBlocked(currentUserUuid, partnerUuid),
              isUserBlocked(partnerUuid, currentUserUuid),
            ]);
            if (iBlocked || theyBlocked || isPartnerDeleted) {
              toast({
                title: "Cannot send message",
                description: "You cannot send messages to this user.",
                variant: "destructive",
              });
              return;
            }
            // Ensure mediaType is 'image' | 'video' | undefined
            const validMediaType: "image" | "video" | undefined =
              mediaType === "image" || mediaType === "video"
                ? mediaType
                : undefined;
            sendMessage(value, mediaUrl, validMediaType);
          }}
          sending={sending}
          disabled={iBlockedThem || theyBlockedMe || isPartnerDeleted}
          currentUserUuid={currentUserUuid}
          partnerUuid={partnerUuid}
        />
      </div>
      {/* Media Viewer Modal */}
      <MediaViewerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mediaUrl={modalMediaUrl || ""}
        mediaType={modalMediaType as "image" | "video"}
        timestamp={modalTimestamp}
        sender={modalSender}
      />
    </div>
  );
};

export default DirectChatPage;
