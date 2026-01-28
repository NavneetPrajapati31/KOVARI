"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarGroup, Spinner } from "@heroui/react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  MoreVertical,
  Mic,
  Send,
  Loader2,
  Smile,
  AlertCircle,
  Users,
  Lock,
  User,
  Plus,
  Flag,
  Image,
} from "lucide-react";
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { PiPaperclip } from "react-icons/pi";
import { HiPlay } from "react-icons/hi";
import { useGroupChat, type ChatMessage } from "@/shared/hooks/useGroupChat";
import { useGroupMembers } from "@/shared/hooks/useGroupMembers";
import { useGroupEncryption } from "@/shared/hooks/useGroupEncryption";
import { useGroupMembership } from "@/shared/hooks/useGroupMembership";
import { toast } from "sonner";
import { Shield, ShieldCheck } from "lucide-react";
import { Chip } from "@heroui/react";
import Picker from "@emoji-mart/react";
import data from "@emoji-mart/data";
import {
  isSameDay,
  formatMessageDate,
  linkifyMessage,
} from "@/shared/utils/utils";
import GroupMediaSection from "@/features/groups/components/group-media-section";
import { useUser } from "@clerk/nextjs";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
import { Skeleton } from "@heroui/react";
import MediaViewerModal from "@/shared/components/media-viewer-modal";
import { ReportDialog } from "@/shared/components/ReportDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import Link from "next/link";

const MAX_MESSAGE_LENGTH = 1000; // Maximum message length in characters

// Utility: Check if message content is real text (not empty, not placeholder)
const isRealTextMessage = (content: string) => {
  if (!content) return false;
  const trimmed = content.trim();
  return trimmed !== "" && trimmed !== "[Encrypted message]";
};

/** Skeleton shown after membership check while chat/messages are loading */
function ChatPageSkeleton() {
  return (
    <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden h-[90vh] min-h-[50dvh] sm:min-h-[60dvh]">
      <div className="flex h-full min-h-0">
        {/* Sidebar skeleton - hidden on small/medium like real sidebar */}
        <div className="w-full md:w-80 lg:w-96 border-r border-border bg-muted/30 overflow-hidden hidden lg:block shrink-0">
          <div className="p-4 sm:p-5 overflow-y-auto h-full">
            <div className="text-center mb-3 sm:mb-4 border-b border-border pb-3 sm:pb-4">
              <Skeleton className="mx-auto mb-2 sm:mb-3 rounded-full w-14 h-14 sm:w-16 sm:h-16" />
              <Skeleton className="h-3.5 sm:h-4 w-24 sm:w-32 mx-auto mb-1.5 sm:mb-2 rounded-lg" />
              <Skeleton className="h-3 w-16 sm:w-20 mx-auto rounded-lg" />
            </div>
            <div className="mb-3 border-b border-border pb-3 sm:pb-4">
              <div className="flex items-center justify-between mt-2 mb-2 sm:mb-3">
                <Skeleton className="h-3 sm:h-3.5 w-14 sm:w-16 rounded-lg" />
                <Skeleton className="h-3 w-10 sm:w-12 rounded-lg" />
              </div>
              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <Skeleton key={i} className="rounded-full w-8 h-8 sm:w-10 sm:h-10 shrink-0" />
                ))}
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mt-3 sm:mt-4 mb-2 sm:mb-3">
                <Skeleton className="h-3 sm:h-3.5 w-24 sm:w-28 rounded-lg" />
                <Skeleton className="h-3 w-12 sm:w-14 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg sm:rounded-xl min-h-0" />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main chat area skeleton */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Header */}
          <div className="shrink-0 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 border-b border-border">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <Skeleton className="h-3 w-[60%] min-w-[6rem] max-w-[8rem] sm:max-w-[10rem] md:max-w-[11rem] mb-1.5 sm:mb-2 rounded-lg" />
                <Skeleton className="h-3 w-14 sm:w-20 rounded-lg" />
              </div>
              {/* <div className="flex items-center gap-1 shrink-0">
                <Skeleton className="rounded-full w-8 h-8 sm:w-9 sm:h-9" />
                <Skeleton className="rounded-full w-8 h-8 sm:w-9 sm:h-9" />
              </div> */}
            </div>
          </div>

          {/* Messages area - scrollable */}
          <div className="flex-1 min-h-0 overflow-hidden p-3 sm:p-4 space-y-3 sm:space-y-4">
            {(["sender", "user", "sender", "user", "sender", "user", "sender", "user","sender","user"] as const).map((type, i) =>
              type === "sender" ? (
                <div key={i} className="flex justify-start">
                  <div className="flex items-end gap-1.5 sm:gap-2 w-[70%] min-w-[4rem] max-w-[12rem] sm:max-w-[14rem]">
                    <Skeleton className="rounded-full w-7 h-7 sm:w-8 sm:h-8 shrink-0" />
                    <Skeleton className="h-10 sm:h-12 w-[70%] min-w-[4rem] max-w-[12rem] sm:max-w-[14rem] rounded-2xl rounded-bl-md shrink-0" />
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-end">
                  <Skeleton className="h-9 sm:h-10 w-[55%] min-w-[3.5rem] max-w-[10rem] sm:max-w-[11rem] rounded-2xl rounded-br-md shrink-0" />
                </div>
              )
            )}
          </div>

          {/* Input bar */}
          <div className="shrink-0 border-t border-border px-2 sm:px-3 py-3">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Skeleton className="rounded-full w-7 h-7 shrink-0" />
              <Skeleton className="flex-1 min-w-0 h-7 rounded-full max-w-full" />
              <Skeleton className="rounded-full w-7 h-7 shrink-0" />
              <Skeleton className="rounded-full w-7 h-7 shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GroupChatInterface() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [messageLengthError, setMessageLengthError] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  // console.log("Current message state:", message);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevGroupIdRef = useRef<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // const fileInputRef = useRef<HTMLInputElement>(null); // Removed as per edit hint

  // Add state and ref for chat file picker
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const [chatUploading, setChatUploading] = useState(false);

  // Add modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMediaUrl, setModalMediaUrl] = useState<string | null>(null);
  const [modalMediaType, setModalMediaType] = useState<
    "image" | "video" | null
  >(null);
  const [modalTimestamp, setModalTimestamp] = useState<string | undefined>(
    undefined
  );
  const [modalSender, setModalSender] = useState<string | undefined>(undefined);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isMediaSheetOpen, setIsMediaSheetOpen] = useState(false);

  const {
    messages,
    loading,
    sending,
    error,
    groupInfo,
    onlineMembers,
    sendMessage,
  } = useGroupChat(groupId);

  const { members, loading: membersLoading } = useGroupMembers(groupId);
  const {
    keyFingerprint,
    loading: encryptionLoading,
    isEncryptionAvailable,
  } = useGroupEncryption(groupId);

  // Check user membership status
  const {
    membershipInfo,
    loading: membershipLoading,
    error: membershipError,
    refetch: refetchMembership,
  } = useGroupMembership(groupId);

  // Debug: Log membership error and info
  console.log(
    "membershipError",
    membershipError,
    "membershipInfo",
    membershipInfo
  );

  const { user } = useUser();
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      getUserUuidByClerkId(user.id).then((uuid) => setUserId(uuid));
    }
  }, [user?.id]);

  // Insert emoji at cursor position
  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const value = textarea.value;
    const newValue = value.slice(0, start) + emoji + value.slice(end);
    setMessage(newValue);
    // Move cursor after emoji (next render)
    setTimeout(() => {
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
      textarea.focus();
    }, 0);
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [message]);

  // Check message length
  useEffect(() => {
    setMessageLengthError(message.length > MAX_MESSAGE_LENGTH);
  }, [message]);

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

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
      console.log("[Chat Scroll Debug] scrollHeight:", container.scrollHeight);
      console.log("[Chat Scroll Debug] clientHeight:", container.clientHeight);
      console.log("[Chat Scroll Debug] children:", container.children.length);
      if (container.lastElementChild) {
        console.log(
          "[Chat Scroll Debug] last child:",
          container.lastElementChild
        );
      }
    }
  }, [messages, groupId]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Handle membership errors
  useEffect(() => {
    if (membershipError) {
      if (membershipError.includes("Not a member")) {
        toast.error("You are not a member of this group");
        // Redirect to groups page after a short delay
        // setTimeout(() => {
        //   router.push("/groups");
        // }, 2000);
      } else if (membershipError.includes("Group not found")) {
        toast.error("Group not found");
        // router.push("/groups");
      } else {
        toast.error(membershipError);
      }
    }
  }, [membershipError, router]);

  const handleSendMessage = async () => {
    // Block sending messages if group is pending
    if (groupInfo?.status === "pending") {
      toast.error("Cannot send messages while group is under review");
      return;
    }
    if (message.trim() && !sending && !messageLengthError) {
      const messageToSend = message.trim();
      setMessage(""); // Clear input immediately for better UX

      try {
        await sendMessage(messageToSend);
        // Message is already added optimistically in the hook
      } catch (err) {
        console.error("Failed to send message:", err);
        toast.error("Failed to send message. Please try again.");
        // Optionally restore the message to input if it failed
        // setMessage(messageToSend);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!messageLengthError) {
        handleSendMessage();
      }
    }
    // Shift+Enter: allow default (newline)
  };

  // Add upload handler for chat input
  // const userId = /* get user id from props, context, or hook */;

  const handleChatFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return; // Only proceed if userId is loaded
    setChatUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uploaded_by", userId); // use real user id
      const res = await fetch(`/api/groups/${groupId}/media`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to upload");
      }
      const uploaded = await res.json();
      // Send a message with the media URL and type
      await sendMessage("", uploaded.url, uploaded.type);
    } catch (err) {
      // Optionally show error toast
    } finally {
      setChatUploading(false);
      if (chatFileInputRef.current) chatFileInputRef.current.value = "";
    }
  };

  // Handle rejoining after being removed
  const handleRejoinGroup = async () => {
    setIsRejoining(true);
    try {
      const response = await fetch(`/api/groups/${groupId}/join-request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        toast.success("Join request sent successfully");
        // Refetch membership info
        await refetchMembership();
      } else {
        const data = await response.json();
        toast.error(data.error || "Failed to send join request");
      }
    } catch (err) {
      console.error("Error sending join request:", err);
      toast.error("Failed to send join request");
    } finally {
      setIsRejoining(false);
    }
  };

  // Group messages by date and add separators
  const messagesWithSeparators = useMemo(() => {
    const result: Array<{
      type: "message" | "separator";
      data: any;
      date?: string;
    }> = [];
    messages.forEach((msg, index) => {
      const messageDate = msg.createdAt;
      if (
        index === 0 ||
        !isSameDay(messageDate, messages[index - 1].createdAt)
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

  // Membership check and error handling must be before any layout rendering
  if (membershipLoading) {
    return (
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[90vh]">
        <div className="flex items-center space-x-2">
          <Spinner variant="spinner" size="sm" color="primary" />
          <span className="text-primary text-sm">Checking membership...</span>
        </div>
      </div>
    );
  }

  const isNotMember =
    (!membershipLoading &&
      membershipInfo &&
      !membershipInfo.isMember &&
      !membershipInfo.isCreator) ||
    (membershipError && membershipError.includes("Not a member"));

  const hasPendingRequest = membershipInfo?.hasPendingRequest || false;

  if (isNotMember) {
    return (
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[90vh]">
        <div className="text-center max-w-md mx-auto p-8 flex flex-col items-center justify-center">
          <h2 className="text-md font-semibold text-foreground mb-2">
            Join the group to access chats
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            You need to be a member of this group to view the chat.
          </p>
          <Button
            onClick={handleRejoinGroup}
            disabled={isRejoining}
            className={`w-full mb-2 text-xs ${hasPendingRequest ? "pointer-events-none" : ""}`}
            variant={hasPendingRequest ? "outline" : "default"}
          >
            {isRejoining ? (
              <>
                <Spinner
                  variant="spinner"
                  size="sm"
                  className="mr-1"
                  classNames={{ spinnerBars: "bg-white" }}
                />
                Requesting...
              </>
            ) : hasPendingRequest ? (
              "Request Pending"
            ) : (
              "Request to Join Group"
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/groups")}
            className="w-full text-xs"
          >
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  if (membershipError && membershipError.includes("Group not found")) {
    return (
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[90vh]">
        <div className="text-center max-w-md mx-auto p-6 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-md font-semibold text-foreground mb-2">
            Group Not Found
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            The group you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/groups")}
            className="w-full text-xs"
          >
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  // Check if group is pending - show "under review" message for all users (including creators)
  const isPending = groupInfo?.status === "pending";

  if (isPending) {
    return (
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[90vh]">
        <div className="text-center max-w-md mx-auto p-6 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-md font-semibold text-foreground mb-2">
            Group Under Review
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            This group is currently pending admin approval and is not available
            for viewing or interaction.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/groups")}
            className="w-full text-xs"
          >
            Back to Groups
          </Button>
        </div>
      </div>
    );
  }

  // After membership check: show skeletons only on initial load (not when sending or refetching)
  if (loading && messages.length === 0) {
    return <ChatPageSkeleton />;
  }

  return (
    <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden">
      <div className="flex h-[90vh]">
        {/* Right Sidebar */}
        <div className="w-full md:w-80 lg:w-96 border-r border-border bg-muted/30 overflow-y-auto scrollbar-none hidden lg:block">
          <div className="p-5">
            {/* Company Info */}
            <div className="text-center mb-3 border-b-1 border-border">
              <div className="flex items-center justify-center mx-auto mb-3">
                <Avatar src={groupInfo?.cover_image} size={"lg"} />
              </div>
              <h2 className="text-md font-semibold text-foreground">
                {groupInfo?.name || "Loading..."}
              </h2>
              <p className="text-xs text-muted-foreground font-medium">
                {members.length} member{members.length !== 1 ? "s" : ""}
              </p>
              {groupInfo?.description && (
                <p className="text-xs text-muted-foreground mt-2 text-left mb-3">
                  {groupInfo.description}
                </p>
              )}
            </div>

            {/* Members */}
            <div className="mb-3 border-b-1 border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Members
                </h3>
                <Link href={`/groups/${groupId}/settings?tab=members`}>
                  <Button className="bg-transparent text-primary text-sm p-0 h-auto font-medium">
                    See all
                  </Button>
                </Link>
              </div>
              {membersLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <AvatarGroup
                  max={10}
                  total={members.length}
                  className="justify-start mb-4"
                  renderCount={(count) => {
                    const remainingCount = members.length - 10;
                    return remainingCount > 0 ? (
                      <div className="w-11 h-11 bg-primary rounded-full flex items-center justify-center border-2 border-background">
                        <span className="text-primary-foreground text-xs font-medium">
                          +{remainingCount}
                        </span>
                      </div>
                    ) : null;
                  }}
                >
                  {members.map((member) => (
                    <Avatar
                      key={member.id}
                      src={member.avatar}
                      className="w-10 h-10"
                      name={member.name}
                    />
                  ))}
                </AvatarGroup>
              )}
            </div>

            {/* Photos and Videos */}
            {userId ? (
              <GroupMediaSection groupId={groupId} userId={userId} />
            ) : (
              <div className="flex items-center justify-center py-4">
                <Spinner variant="spinner" size="sm" color="primary" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Loading media...
                </span>
              </div>
            )}

            {/* Shared Files */}
            {/* <div className="mb-3 border-b-1 border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Shared files
                </h3>
                <Button className="bg-transparent text-primary text-sm p-0 h-auto font-medium">
                  See all
                </Button>
              </div>
              <div className="space-y-0 mb-3">
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-xs font-bold">
                      DOC
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      terms_of_reference.docx
                    </p>
                    <p className="text-xs text-muted-foreground">3.9 MB</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-xs font-bold">
                      XLS
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      contracting_agreement.xls
                    </p>
                    <p className="text-xs text-muted-foreground">42 KB</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-foreground text-xs font-bold">
                      SVG
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      clientlogo.svg
                    </p>
                    <p className="text-xs text-muted-foreground">1.2 MB</p>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Shared Links */}
            {/* <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Shared links
                </h3>
                <Button className="bg-transparent text-primary text-sm p-0 h-auto font-medium">
                  See all
                </Button>
              </div>
              <div className="space-y-0">
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📹</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Google Meet
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      meet.google.com/uls-sxqr-rtb
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">🎨</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      Behance
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      https://www.behance.net/gallery/187...
                    </p>
                  </div>
                </div>
              </div>
            </div> */}
          </div>
        </div>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-3 sm:px-5 py-3 border-b border-border bg-transparent">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xs font-semibold text-foreground">
                    {groupInfo?.name || "Loading..."}
                  </h1>
                  {/* {isEncryptionAvailable && keyFingerprint && (
                    <Chip
                      size="sm"
                      variant="bordered"
                      className="text-xs capitalize flex-shrink-0 self-center bg-primary-light border-1 border-primary text-primary px-2"
                    >
                      <div className="flex items-center gap-1 text-xs text-primary">
                        <ShieldCheck className="h-3 w-3" />
                        <span>End-to-end encrypted</span>
                      </div>
                    </Chip>
                  )}
                  {!isEncryptionAvailable && !encryptionLoading && (
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <Shield className="h-3 w-3" />
                      <span>Encryption unavailable</span>
                    </div>
                  )} */}
                </div>
                <p className="text-xs text-muted-foreground">
                  {members.length} members
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="lg:hidden p-2 rounded-full bg-transparent text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0"
                  aria-label="Photos and videos"
                  onClick={() => setIsMediaSheetOpen(true)}
                >
                  <ImageOutlinedIcon className="h-5 w-5 text-muted-foreground" />
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="p-2 rounded-full bg-transparent text-muted-foreground hover:text-foreground focus:outline-none focus:ring-0"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-4 py-2 min-w-[160px] rounded-2xl shadow-sm backdrop-blur-2xl bg-white/70 transition-all duration-300 ease-in-out border-border">
                  <DropdownMenuItem
                    onClick={() => setIsReportDialogOpen(true)}
                     className="text-destructive font-semibold hover:cursor-pointer focus:bg-transparent focus:text-destructive focus-within:!border-none focus-within:!outline-none"
                  >
                    {/* <Flag className="h-4 w-4" /> */}
                    <span className="flex items-center gap-2">
              {/* <Flag className="h-4 w-4" /> */}
              Report Group
            </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Photos & videos: direct full-screen gallery on small screens (no middle view) */}
          {isMediaSheetOpen && (
            <div className="fixed inset-0 z-[90] bg-background">
              {userId ? (
                <GroupMediaSection
                  groupId={groupId}
                  userId={userId}
                  initialGalleryOpen
                  onGalleryClose={() => setIsMediaSheetOpen(false)}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <Spinner variant="spinner" size="sm" color="primary" />
                  <span className="ml-2 text-sm text-muted-foreground">
                    Loading...
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-none bg-card"
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
                {messagesWithSeparators.map((item, idx) => {
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
                  // console.log("MSG", msg);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isCurrentUser ? "justify-end" : "justify-start"} mb-0.5`}
                    >
                      <div
                        className={`flex max-w-[75%] ${msg.isCurrentUser ? "flex-row-reverse" : "flex-row"} flex items-end gap-2`}
                      >
                        {!msg.isCurrentUser &&
                          (msg.sender === "Deleted User" ? (
                            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-muted flex items-center justify-center">
                              <User className="w-5 h-5 text-muted-foreground" />
                            </div>
                          ) : (
                            <Avatar
                              className="w-8 h-8 flex-shrink-0"
                              src={msg.avatar || ""}
                              name={msg.sender}
                            />
                          ))}
                        <div
                          className={`flex flex-col ${msg.isCurrentUser ? "items-end" : "items-start"}`}
                        >
                          {/* MEDIA: Render outside the bubble, Telegram style */}
                          {!msg.isCurrentUser &&
                            msg.sender &&
                            (msg.mediaType === "image" ||
                              msg.mediaType === "video") && (
                              <span className="inline-block font-semibold text-xs mb-1 mt-1 ml-1 text-muted-foreground">
                                {msg.sender}
                              </span>
                            )}
                          {msg.mediaUrl && msg.mediaType === "image" && (
                            <button
                              type="button"
                              className="overflow-hidden rounded-2xl focus:outline-none focus:ring-0"
                              aria-label="View image in full screen"
                              tabIndex={0}
                              onClick={() => {
                                setModalMediaUrl(msg.mediaUrl);
                                setModalMediaType("image");
                                setModalTimestamp(msg.createdAt); // Use raw ISO date
                                setModalSender(msg.sender);
                                setModalOpen(true);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  setModalMediaUrl(msg.mediaUrl);
                                  setModalMediaType("image");
                                  setModalTimestamp(msg.createdAt); // Use raw ISO date
                                  setModalSender(msg.sender);
                                  setModalOpen(true);
                                }
                              }}
                            >
                              <MediaWithSkeleton
                                url={msg.mediaUrl}
                                timestamp={msg.timestamp}
                              />
                            </button>
                          )}
                          {msg.mediaUrl && msg.mediaType === "video" && (
                            <button
                              type="button"
                              className="overflow-hidden rounded-2xl focus:outline-none focus:ring-0"
                              aria-label="View video in full screen"
                              tabIndex={0}
                              onClick={() => {
                                setModalMediaUrl(msg.mediaUrl);
                                setModalMediaType("video");
                                setModalTimestamp(msg.createdAt); // Use raw ISO date
                                setModalSender(msg.sender);
                                setModalOpen(true);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  setModalMediaUrl(msg.mediaUrl);
                                  setModalMediaType("video");
                                  setModalTimestamp(msg.createdAt); // Use raw ISO date
                                  setModalSender(msg.sender);
                                  setModalOpen(true);
                                }
                              }}
                            >
                              <VideoWithSkeleton
                                url={msg.mediaUrl}
                                timestamp={msg.timestamp}
                              />
                            </button>
                          )}
                          {/* TEXT: Only wrap in bubble if content is real */}
                          {isRealTextMessage(msg.content) && (
                            <div
                              className={`relative px-3 py-1 rounded-2xl text-xs sm:text-sm leading-relaxed break-words whitespace-pre-line ${
                                msg.isCurrentUser
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-gray-100 text-foreground rounded-bl-md"
                              }`}
                            >
                              {!msg.isCurrentUser && (
                                <span className="block text-xs font-semibold text-muted-foreground mb-1 mt-1">
                                  {msg.sender}
                                </span>
                              )}
                              <span
                                className={`text-xs ${
                                  msg.isCurrentUser
                                    ? "text-primary-foreground "
                                    : "text-foreground"
                                } `}
                                dangerouslySetInnerHTML={{
                                  __html: linkifyMessage(msg.content),
                                }}
                              />
                              <span className="flex items-center gap-1 justify-end ml-3 mt-2 float-right">
                                <span
                                  className={`text-[10px] ${msg.isCurrentUser ? "text-white/70" : "text-muted-foreground"}`}
                                >
                                  {msg.timestamp}
                                </span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Message Input - Sticky */}
          <div className="sticky bottom-0 left-0 right-0 z-10 bg-card border-t border-border  px-2 py-2 shadow-none">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                className="rounded-full bg-transparent hover:bg-primary/10 text-primary flex items-center justify-center p-2 focus:outline-none focus:ring-0"
                aria-label="Attach photo or video"
                tabIndex={0}
                onClick={() => chatFileInputRef.current?.click()}
                disabled={chatUploading}
              >
                {/* {chatUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : ( */}
                <PiPaperclip className="h-5 w-5" />
                {/* )} */}
              </button>
              <input
                ref={chatFileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleChatFileChange}
                aria-label="Attach photo or video"
              />

              <div className="flex-1 relative h-auto flex items-center bg-transparent hover:cursor-text">
                <textarea
                  ref={textareaRef}
                  key={groupId}
                  placeholder="Your message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-0 py-2 rounded-none border-none bg-transparent text-xs focus:outline-none resize-none h-full max-h-10 overflow-y-auto scrollbar-hide align-middle ${
                    messageLengthError ? "border-red-500" : ""
                  }`}
                  aria-label="Type your message"
                  disabled={sending}
                  rows={1}
                  tabIndex={0}
                  style={{ lineHeight: "1.5" }}
                />
                {messageLengthError && (
                  <div className="absolute -top-6 left-0 text-xs text-red-500">
                    Message too long ({message.length}/{MAX_MESSAGE_LENGTH}{" "}
                    characters)
                  </div>
                )}
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
                onClick={handleSendMessage}
                disabled={!message.trim() || sending || messageLengthError}
                className="rounded-full bg-transparent hover:bg-primary/90 text-primary disabled:opacity-50 flex items-center justify-center hover:cursor-pointer pr-3"
              >
                {sending ? (
                  <Spinner variant="spinner" size="sm" color="primary" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Place the modal at the root of the component */}
      <MediaViewerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mediaUrl={modalMediaUrl || ""}
        mediaType={modalMediaType as "image" | "video"}
        timestamp={modalTimestamp} // already raw, ensure it's not formatted
        sender={modalSender}
      />
      <ReportDialog
        open={isReportDialogOpen}
        onOpenChange={setIsReportDialogOpen}
        targetType="group"
        targetId={groupId || ""}
        targetName={groupInfo?.name}
      />
    </div>
  );
}

// MediaWithSkeleton component
const MediaWithSkeleton = ({
  url,
  timestamp,
}: {
  url: string;
  timestamp: string;
}) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-40 h-32 md:w-56 md:h-32 max-w-full">
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

// VideoWithSkeleton component
const VideoWithSkeleton = ({
  url,
  timestamp,
}: {
  url: string;
  timestamp: string;
}) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative w-40 h-32 md:w-56 md:h-32 max-w-full">
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
