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

interface Notification {
  id: string;
  title: string;
  message: string;
  avatar?: string;
  avatarFallback: string;
  isRead: boolean;
  type: "user" | "line" | "pool";
}

const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Radouane Khiri",
    message:
      "You are almost out of premium data. Consider upgrading your plan to continue enjoying unlimited access.",
    avatar:
      "https://images.pexels.com/photos/17071640/pexels-photo-17071640.jpeg",
    avatarFallback: "RK",
    isRead: false,
    type: "user",
  },
  {
    id: "2",
    title: "Mom's line",
    message:
      "Congratulations! Your service has been successfully activated. You can now start using all premium features.",
    avatar:
      "https://images.pexels.com/photos/17071640/pexels-photo-17071640.jpeg",
    avatarFallback: "ML",
    isRead: false,
    type: "line",
  },
  {
    id: "3",
    title: "Family Pool",
    message:
      "Payment Reminder: Due in 2 Days. Please ensure your payment method is up to date to avoid service interruption.",
    avatar:
      "https://images.pexels.com/photos/17071640/pexels-photo-17071640.jpeg",
    avatarFallback: "FP",
    isRead: false,
    type: "pool",
  },
  {
    id: "4",
    title: "Dad's line",
    message:
      "You are almost out of premium data. Consider upgrading your plan to continue enjoying unlimited access.",
    avatar:
      "https://images.pexels.com/photos/17071640/pexels-photo-17071640.jpeg",
    avatarFallback: "DL",
    isRead: true,
    type: "line",
  },
  {
    id: "5",
    title: "Sarah Johnson",
    message:
      "New connection request from Sarah. View profile to accept or decline.",
    avatar:
      "https://images.pexels.com/photos/17071640/pexels-photo-17071640.jpeg",
    avatarFallback: "SJ",
    isRead: false,
    type: "user",
  },
  {
    id: "6",
    title: "Travel Group: Paris 2024",
    message:
      "New message in your travel group. Check out the latest updates from your travel companions.",
    avatarFallback: "PG",
    isRead: true,
    type: "pool",
  },
  {
    id: "7",
    title: "Michael Chen",
    message: "Michael shared a new post. Check it out and show your support!",
    avatar:
      "https://images.pexels.com/photos/17071640/pexels-photo-17071640.jpeg",
    avatarFallback: "MC",
    isRead: false,
    type: "user",
  },
  {
    id: "8",
    title: "Work line",
    message:
      "Your monthly usage report is ready. View your detailed analytics and insights.",
    avatarFallback: "WL",
    isRead: true,
    type: "line",
  },
];

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleMarkAllAsRead = () => {
    // Handle mark all as read logic
    console.log("Mark all as read");
  };

  const filteredNotifications = mockNotifications.filter((notification) => {
    // Filter by search query if provided
    const matchesSearch =
      searchQuery === "" ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="h-full w-full bg-background flex flex-col">
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
            className="text-sm !px-0 text-primary font-medium hover:bg-transparent hover:text-primary focus-visible:border-none focus-visible:ring-0"
          >
            Mark all as read
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <Bell className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">
              {searchQuery
                ? "No notifications match your search"
                : "No notifications"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredNotifications.map((notification) => (
              <Link
                key={notification.id}
                href={`/notifications/${notification.id}`}
                className={`flex items-start gap-3 p-4 transition-colors cursor-pointer ${
                  !notification.isRead
                    ? "bg-primary-light hover:bg-primary-light/80"
                    : "hover:bg-muted/50"
                }`}
              >
                {notification.type === "pool" ? (
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                    <div className="w-6 h-6 bg-primary/20 rounded-full" />
                  </div>
                ) : (
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage
                      src={notification.avatar}
                      alt={notification.title}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {notification.avatarFallback}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
