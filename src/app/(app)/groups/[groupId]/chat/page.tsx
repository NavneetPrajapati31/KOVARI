"use client";

import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { useParams } from "next/navigation";
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
} from "lucide-react";
import { useGroupChat, type ChatMessage } from "@/shared/hooks/useGroupChat";
import { useGroupMembers } from "@/shared/hooks/useGroupMembers";
import { useGroupEncryption } from "@/shared/hooks/useGroupEncryption";
import { toast } from "sonner";
import { Shield, ShieldCheck } from "lucide-react";
import { Chip } from "@heroui/react";

export default function GroupChatInterface() {
  const params = useParams();
  const groupId = params.groupId as string;

  const [message, setMessage] = useState("");
  console.log("Current message state:", message);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const prevGroupIdRef = useRef<string | null>(null);

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

  const handleSendMessage = async () => {
    if (message.trim() && !sending) {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-5 border-b border-border bg-transparent">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-md font-semibold text-foreground">
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

                {messages.map((msg: ChatMessage) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.isCurrentUser ? "justify-end" : "justify-start"} mb-2`}
                  >
                    <div
                      className={`flex max-w-[75%] ${msg.isCurrentUser ? "flex-row-reverse" : "flex-row"} items-end gap-3`}
                    >
                      <Avatar
                        className="w-10 h-10 flex-shrink-0"
                        src={msg.avatar || "/placeholder.svg"}
                        name={msg.sender}
                      />

                      <div
                        className={`flex flex-col ${msg.isCurrentUser ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`px-4 py-3 rounded-2xl max-w-md ${
                            msg.isCurrentUser
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-gray-100 text-foreground rounded-bl-md"
                          }`}
                        >
                          {!msg.isCurrentUser && (
                            <span className="block text-sm font-semibold text-muted-foreground mb-1">
                              {msg.sender}
                            </span>
                          )}
                          <p className="text-sm leading-relaxed">
                            {msg.content}
                          </p>
                          <div className="flex items-center justify-end mt-2 gap-1 w-full">
                            <span
                              className={`text-xs ${msg.isCurrentUser ? "text-primary-foreground/80" : "text-muted-foreground"}`}
                            >
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Message Input - Sticky */}
          <div className="sticky bottom-0 left-0 right-0 z-10 bg-card border-t border-border p-4 shadow-none">
            <div className="flex items-center space-x-2">
              <div className="flex-1 relative h-10 bg-gray-100 rounded-full">
                <input
                  key={groupId}
                  type="text"
                  placeholder="Your message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pr-12 h-10 rounded-full placeholder:text-gray-400 w-full bg-gray-100 border-none focus:ring-0 focus:outline-none text-sm px-4"
                />
                <Button
                  size="icon"
                  className="bg-transparent absolute right-1 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                >
                  <Mic className="h-6 w-6" />
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || sending}
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 disabled:opacity-50"
                size="icon"
              >
                {sending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-72 border-l border-border bg-muted/30 overflow-y-auto scrollbar-none hidden lg:block">
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
                  max={7}
                  total={members.length}
                  className="justify-start mb-4"
                  renderCount={(count) => {
                    const remainingCount = members.length - 7;
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
            <div className="mb-3 border-b-1 border-border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Photos and videos
                </h3>
                <Button className="bg-transparent text-primary text-sm p-0 h-auto font-medium">
                  See all
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="aspect-[4/3] rounded-xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&h=150&fit=crop"
                    alt="Team meeting"
                    className="w-full h-full object-cover transition-transform duration-200"
                  />
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=200&h=150&fit=crop"
                    alt="Office workspace"
                    className="w-full h-full object-cover transition-transform duration-200"
                  />
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden">
                  <img
                    src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=200&h=150&fit=crop"
                    alt="Team collaboration"
                    className="w-full h-full object-cover transition-transform duration-200"
                  />
                </div>
                <div className="aspect-[4/3] rounded-xl overflow-hidden relative">
                  <img
                    src="https://images.unsplash.com/photo-1556761175-b413da4baf72?w=200&h=150&fit=crop"
                    alt="Team celebration"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gray-100 opacity-75 flex items-center justify-center rounded-xl">
                    <span className="text-foreground font-semibold text-lg">
                      +178
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Shared Files */}
            <div className="mb-3 border-b-1 border-border">
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
            </div>

            {/* Shared Links */}
            <div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
