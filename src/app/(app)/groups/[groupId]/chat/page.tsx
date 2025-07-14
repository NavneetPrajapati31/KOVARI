"use client";

import { useState, useRef, useEffect, useLayoutEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Avatar, AvatarGroup, Spinner } from "@heroui/react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Search,
  Phone,
  Video,
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
} from "lucide-react";
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

const MAX_MESSAGE_LENGTH = 1000; // Maximum message length in characters

export default function GroupChatInterface() {
  const params = useParams();
  const router = useRouter();
  const groupId = params.groupId as string;

  const [message, setMessage] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [messageLengthError, setMessageLengthError] = useState(false);
  const [isRejoining, setIsRejoining] = useState(false);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  console.log("Current message state:", message);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevGroupIdRef = useRef<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // const fileInputRef = useRef<HTMLInputElement>(null); // Removed as per edit hint

  // Add state and ref for chat file picker
  const chatFileInputRef = useRef<HTMLInputElement>(null);
  const [chatUploading, setChatUploading] = useState(false);

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
      // Optionally, refresh GroupMediaSection (if you want to trigger a refresh, use a callback or context)
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
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[80vh]">
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
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[80vh]">
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
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden flex items-center justify-center h-[80vh]">
        <div className="text-center max-w-md mx-auto p-6 flex flex-col items-center justify-center">
          <div className="flex items-center justify-center mb-2">
            <AlertCircle className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-md font-semibold text-foreground mb-2">
            Group Not Found
          </h2>
          <p className="text-xs text-muted-foreground mb-6">
            The group you're looking for doesn't exist or has been deleted.
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

  if (loading && messages.length === 0) {
    return (
      <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden">
        <div className="flex h-[80vh] items-center justify-center">
          <div className="flex items-center space-x-2">
            <Spinner variant="spinner" size="md" color="primary" />
            {/* <span className="text-muted-foreground">Loading chat...</span> */}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-0 bg-card rounded-3xl shadow-none border border-border overflow-hidden">
      <div className="flex h-[80vh]">
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
                <Button className="bg-transparent text-primary text-sm p-0 h-auto font-medium">
                  See all
                </Button>
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
                  <h1 className="text-sm font-semibold text-foreground">
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
                  {members.length} members, {onlineMembers} online
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="icon"
                  className="bg-transparent text-muted-foreground hover:text-foreground"
                >
                  <Search className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  className="bg-transparent text-muted-foreground hover:text-foreground"
                >
                  <Phone className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  className="bg-transparent text-muted-foreground hover:text-foreground"
                >
                  <Video className="h-5 w-5" />
                </Button>
                <Button
                  size="icon"
                  className="bg-transparent text-muted-foreground hover:text-foreground"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

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
                              className="text-xs"
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
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* Message Input - Sticky */}
          <div className="sticky bottom-0 left-0 right-0 z-10 bg-card border-t border-border  px-2 py-1 shadow-none">
            <div className="flex items-center space-x-1">
              <button
                type="button"
                className="rounded-full bg-transparent hover:bg-primary/10 text-primary flex items-center justify-center p-2 focus:outline-none focus:ring-0"
                aria-label="Attach photo or video"
                tabIndex={0}
                onClick={() => chatFileInputRef.current?.click()}
                disabled={chatUploading}
              >
                {chatUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Plus className="h-5 w-5" />
                )}
              </button>
              <input
                ref={chatFileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleChatFileChange}
                aria-label="Attach photo or video"
              />
              <div className="flex-1 relative h-auto bg-transparent rounded-none hover:cursor-text">
                <textarea
                  ref={textareaRef}
                  key={groupId}
                  placeholder="Your message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`w-full px-4 py-2 rounded-none border-none bg-transparent text-sm focus:outline-none resize-none min-h-[40px] max-h-40 overflow-y-auto ${
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
    </div>
  );
}
