"use client";

import { useEffect, useState } from "react";
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
import { Search, Check, CheckCheck } from "lucide-react";
import { useDirectInbox } from "@/shared/hooks/use-direct-inbox";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";
import { createClient } from "@/lib/supabase";

interface UserProfile {
  name?: string;
  username?: string;
  profile_photo?: string;
}

export default function Inbox() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const params = useParams();
  const currentChatUserId = params?.userId as string;
  const [currentUserUuid, setCurrentUserUuid] = useState<string>("");
  const [userProfiles, setUserProfiles] = useState<Record<string, UserProfile>>(
    {}
  );
  const inbox = useDirectInbox(currentUserUuid, currentChatUserId);
  const supabase = createClient();

  // Commented out dummy data for reference
  /*
  const messages = [
    {
      id: 1,
      name: "TechPulse Company",
      message: "Reminder that we have a project meeti...",
      time: "13:02",
      avatar: "/placeholder.svg?height=40&width=40",
      isRead: true,
      hasDoubleCheck: true,
      isOnline: false,
      unreadCount: 0,
    },
    // ... rest of dummy data
  ];
  */

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
        .select("user_id, name, username, profile_photo")
        .in("user_id", userIds);

      if (!error && data) {
        const profilesMap: Record<string, UserProfile> = {};
        data.forEach((profile: any) => {
          profilesMap[profile.user_id] = {
            name: profile.name,
            username: profile.username,
            profile_photo: profile.profile_photo,
          };
        });
        setUserProfiles(profilesMap);
      }
    };

    fetchUserProfiles();
  }, [inbox.conversations, supabase]);

  const handleConversationClick = (userId: string) => {
    inbox.markConversationRead(userId);
    router.push(`/chat/${userId}`);
  };

  if (inbox.loading) {
    return (
      <div className="h-full flex flex-col bg-gray-50">
        {/* Search Bar */}
        <div className="p-3.5 bg-card flex-shrink-0 border-b border-border">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search"
              className="w-full pl-4 pr-12 py-2 bg-gray-100 border-0 rounded-md text-muted-foreground placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-300"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="flex-1 bg-card flex items-center justify-center">
          <Spinner variant="spinner" size="md" color="primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-card">
      {/* Search Bar */}
      <div className="p-3.5 bg-card flex-shrink-0 border-b border-border">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search"
            className="w-full pl-4 pr-12 py-2 bg-gray-100 border-0 rounded-md text-muted-foreground placeholder:text-gray-400 focus-visible:ring-1 focus-visible:ring-gray-300"
          />
          <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 bg-card overflow-y-auto scrollbar-hide">
        {inbox.conversations.length === 0 ? (
          <div className="flex items-center justify-center p-8 h-full">
            <span className="text-muted-foreground">No conversations yet.</span>
          </div>
        ) : (
          inbox.conversations.map((conversation, index) => {
            const profile = userProfiles[conversation.userId];
            const displayName = profile?.name || profile?.username || "Unknown";
            const time = new Date(
              conversation.lastMessageAt
            ).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            const isActive = currentChatUserId === conversation.userId;

            return (
              <div
                key={conversation.userId}
                className={`flex items-center px-4 py-3  cursor-pointer transition-colors ${
                  index !== inbox.conversations.length - 1
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
                <div className="relative mr-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage
                      src={profile?.profile_photo || "/placeholder.svg"}
                      alt={displayName}
                    />
                    <AvatarFallback className="bg-gray-200 text-gray-600 text-sm font-medium">
                      {displayName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  {/* Online indicator - you can implement this based on your requirements */}
                  {/* <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full"></div> */}
                </div>

                {/* Message Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isActive ? "text-primary" : "text-foreground"
                      }`}
                    >
                      {displayName}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {time}
                      </span>
                      {/* Message status indicators - you can implement based on your requirements */}
                      {/* <CheckCheck className="h-4 w-4 text-blue-500" /> */}
                      {/* <Check className="h-4 w-4 text-gray-400" /> */}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs truncate pr-2 ${
                        isActive ? "text-primary" : "text-gray-500"
                      }`}
                    >
                      {conversation.lastMessage}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge
                        className="bg-blue-500 hover:bg-blue-600 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center ml-2"
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
          })
        )}
      </div>
    </div>
  );
}
