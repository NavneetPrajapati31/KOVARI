"use client";

import { useState } from "react";
import { Search, Bell, ChevronRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/shared/components/ui/avatar";
import Link from "next/link";
import { useNotifications } from "@/shared/hooks/useNotifications";
import { Notification } from "@/shared/types/notifications";
import {
  getNotificationLink,
  getAvatarFallback,
  shouldShowPoolIcon,
} from "@/shared/utils/notificationHelpers";
import { Skeleton } from "@heroui/react";
import InboxChatListSkeleton from "@/shared/components/layout/inbox-chat-list-skeleton";

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const { notifications, loading, error, markAllAsRead, markAsRead, unreadCount } =
    useNotifications({ limit: 100, unreadOnly: false, realtime: true });

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    // Filter by search query if provided
    const matchesSearch =
      searchQuery === "" ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="h-full w-full bg-card flex flex-col">
      {/* Search Bar */}
      {/* <div className="p-4 border-b border-border flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search Lines"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-full"
          />
        </div>
      </div> */}

      {/* Header */}
      <div className="p-4 py-3 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-foreground">
            Notifications
          </h1>
          <Button
            variant="ghost"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="text-sm !px-0 text-primary font-medium hover:bg-transparent hover:text-primary focus-visible:border-none focus-visible:ring-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {loading ? (
          <InboxChatListSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Bell className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Bell className="w-5 h-5 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No notifications match your search"
                : "No notifications"}
            </p>
          </div>
        ) : (
          <div>
            {filteredNotifications.map((notification) => {
              const notificationLink = getNotificationLink(notification);
              const showPoolIcon = shouldShowPoolIcon(notification);
              const avatarFallback = getAvatarFallback(notification.title);

              return (
                <Link
                  key={notification.id}
                  href={notificationLink}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 p-4 transition-colors cursor-pointer border-b ${
                    !notification.is_read
                      ? "bg-primary-light border-border"
                      : "hover:bg-muted/50 border-border"
                  }`}
                >
                  {showPoolIcon ? (
                    <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary-light flex items-center justify-center">
                      <div className="w-6 h-6 bg-primary-light rounded-full" />
                    </div>
                  ) : (
                    <Avatar className="w-10 h-10 flex-shrink-0">
                      <AvatarImage src={undefined} alt={notification.title} />
                      <AvatarFallback className="bg-primary-light text-primary">
                        {avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
