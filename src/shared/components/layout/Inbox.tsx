"use client";

import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/shared/components/ui/input";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Spinner } from "@heroui/react";
import { Search, Check, CheckCheck, User } from "lucide-react";
import { X } from "lucide-react";
import { BsImage } from "react-icons/bs";
import { BsCameraVideoFill } from "react-icons/bs";
import {
  useDirectInbox,
  Conversation as BaseConversation,
} from "@/shared/hooks/use-direct-inbox";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
import { createClient } from "@/lib/supabase";
import InboxChatListSkeleton from "./inbox-chat-list-skeleton";

interface UserProfile {
  name?: string;
  username?: string;
  profile_photo?: string;
  deleted?: boolean;
}

interface InboxProps {
  activeUserId?: string;
}

// Extend Conversation type to include lastMediaType for local UI state
type Conversation = BaseConversation & { lastMediaType?: string };

export default function Inbox({ activeUserId }: InboxProps) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [currentUserUuid, setCurrentUserUuid] = useState<string>("");
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>(
    {}
  );
  const [searchQuery, setSearchQuery] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);
  const handleSearch = () => {
    // Filtering is already live, but this can be used for analytics or focus/blur
    // Optionally, you could debounce or only filter on button click
  };
  const handleClearSearch = () => {
    setSearchQuery("");
    inputRef.current?.focus();
  };
  const inbox = useDirectInbox(currentUserUuid);
  // Use only inbox.conversations as the source of truth
  const supabase = createClient();

  useEffect(() => {
    if (!user?.id) return;
    getUserUuidByClerkId(user.id).then((uuid) =>
      setCurrentUserUuid(uuid || "")
    );
  }, [user?.id]);

  useEffect(() => {
    if (!inbox.conversations.length) return;

    const fetchUserProfiles = async () => {
      const userIds = inbox.conversations.map((conv) => conv.userId);
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, username, profile_photo, deleted")
        .in("user_id", userIds);

      if (!error && data) {
        const profilesMap: Record<string, UserProfile> = {};
        data.forEach((profile: any) => {
          profilesMap[profile.user_id] = {
            name: profile.name,
            username: profile.username,
            profile_photo: profile.profile_photo,
            deleted: profile.deleted,
          };
        });
        setUserProfiles(profilesMap);
      }
    };

    fetchUserProfiles();
  }, [inbox.conversations, supabase]);

  useEffect(() => {
    const handler = (e: any) => {
      const { partnerId, message, createdAt, mediaType } = e.detail;
      setUserProfiles((prevProfiles) => ({ ...prevProfiles })); // force rerender if needed
      // Directly mutate inbox.conversations to add lastMediaType
      const conv = inbox.conversations.find(
        (c) =>
          c.userId === partnerId &&
          new Date(createdAt) > new Date(c.lastMessageAt)
      );
      if (conv) {
        (conv as any).lastMediaType = mediaType;
        conv.lastMessage = message;
        conv.lastMessageAt = createdAt;
      }
    };
    window.addEventListener("inbox-message-update", handler);
    return () => window.removeEventListener("inbox-message-update", handler);
  }, [inbox]);

  const handleConversationClick = (userId: string) => {
    // conversations.forEach(conv => {
    //   if (conv.userId === userId) {
    //     conv.unreadCount = 0; // Mark as read
    //   }
    // });
    // setConversations([...conversations]); // Force re-render to update unreadCount
    inbox.markConversationRead(userId);
    router.push(`/chat/${userId}`);
  };

  if (!currentUserUuid || inbox.loading) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Search Bar */}
        <div className="p-3 bg-card flex-shrink-0 border-b border-border sticky top-0 z-50 bg-card">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search"
              className="w-full pl-4 pr-12 py-2 bg-gray-100 border-0 rounded-md text-muted-foreground placeholder:text-gray-400 text-sm placeholder:text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-300"
            />
            <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <InboxChatListSkeleton />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Search Bar */}
      <div className="p-3 bg-card flex-shrink-0 border-b border-border sticky top-0 z-50 bg-card">
        <div className="relative">
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-4 pr-12 py-2 bg-gray-100 border-0 rounded-md text-muted-foreground placeholder:text-gray-400 text-sm placeholder:text-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-gray-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search conversations"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            ref={inputRef}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={handleClearSearch}
              aria-label="Clear search"
              tabIndex={0}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSearch}
              aria-label="Search"
              tabIndex={0}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Search className="h-5 w-5 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 min-h-0 bg-card overflow-y-auto scrollbar-hide">
        {(() => {
          if (inbox.conversations.length === 0) {
            return (
              <div className="flex items-center justify-center p-8 h-full">
                <span className="text-muted-foreground">
                  No conversations found.
                </span>
              </div>
            );
          }
          if (!inbox.loading && inbox.conversations.length === 0) {
            return (
              <div className="flex items-center justify-center p-8 h-full">
                <span className="text-muted-foreground">
                  No conversations yet.
                </span>
              </div>
            );
          }
          const filteredConversations = inbox.conversations.filter(
            (conversation) => {
              const profile = userProfiles[conversation.userId];
              const displayName =
                profile?.name || profile?.username || "Unknown";
              const username = profile?.username || "";
              const lastMessage = conversation.lastMessage || "";
              const query = searchQuery.trim().toLowerCase();
              if (!query) return true;
              return (
                displayName.toLowerCase().includes(query) ||
                username.toLowerCase().includes(query)
                // lastMessage.toLowerCase().includes(query)
              );
            }
          );
          if (
            !inbox.loading &&
            inbox.conversations.length > 0 &&
            filteredConversations.length === 0
          ) {
            return (
              <div className="flex items-center justify-center p-8 h-full">
                <span className="text-muted-foreground">
                  No conversations found.
                </span>
              </div>
            );
          }
          if (!inbox.loading && inbox.conversations.length === 0) {
            return (
              <div className="flex items-center justify-center p-8 h-full">
                <span className="text-muted-foreground">
                  No conversations yet.
                </span>
              </div>
            );
          }
          return filteredConversations.map((conversation, index) => {
            const profile = userProfiles[conversation.userId];
            const isDeleted = profile?.deleted === true;
            const displayName = isDeleted
              ? "Deleted User"
              : profile?.name || profile?.username || "Unknown";
            const time = new Date(
              conversation.lastMessageAt
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const isActive = activeUserId === conversation.userId;
            const isInit = (conversation as any).lastMediaType === "init";

            return (
              <div
                key={conversation.userId}
                className={`flex items-center px-4 py-3  cursor-pointer transition-colors ${
                  index !== filteredConversations.length - 1
                    ? "border-b border-border"
                    : ""
                } ${isActive ? "bg-primary-light" : "hover:bg-gray-100"}`}
                onClick={() => handleConversationClick(conversation.userId)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleConversationClick(conversation.userId);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`Open chat with ${displayName}`}
              >
                {/* Avatar */}
                <div
                  className={`relative mr-3 rounded-full ${isInit ? "ring-2 ring-primary ring-offset-2" : ""}`}
                >
                  <Avatar className="h-12 w-12 bg-muted">
                    <AvatarImage
                      src={isDeleted ? "" : profile?.profile_photo || ""}
                      alt={displayName}
                    />
                    <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                      {isDeleted ? (
                        <User className="h-5 w-5" />
                      ) : (
                        displayName
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .slice(0, 2)
                      )}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isActive ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {displayName}
                      {conversation.userId === currentUserUuid && (
                        <span className={"text-xs ml-1"}>(You)</span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {time}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs truncate pr-2 flex flex-row items-center ${
                        isActive ? "text-primary" : "text-gray-500"
                      }`}
                    >
                      {(conversation as any).lastMediaType === "image" ? (
                        <>
                          <span role="img" aria-label="Photo" className="mr-1">
                            <BsImage className="h-3 w-3" />
                          </span>
                          <span>Photo</span>
                        </>
                      ) : (conversation as any).lastMediaType === "video" ? (
                        <>
                          <span role="img" aria-label="Video" className="mr-1">
                            <BsCameraVideoFill className="h-3 w-3" />
                          </span>
                          <span>Video</span>
                        </>
                      ) : (conversation as any).lastMediaType === "init" ? (
                        <span className="font-medium text-primary">
                          Start a conversation!
                        </span>
                      ) : (
                        conversation.lastMessage
                      )}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge
                        className="bg-primary text-primary-foreground text-xs min-w-[20px] h-4 rounded-full flex items-center justify-center ml-2"
                        aria-label={`${conversation.unreadCount} unread messages`}
                        tabIndex={0}
                      >
                        {conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
