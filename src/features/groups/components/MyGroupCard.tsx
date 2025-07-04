"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, Card, Image, Skeleton, Divider } from "@heroui/react";
import { MapPin, Calendar, Users, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import GroupCardSkeleton from "@/features/explore/components/GroupCardSkeleton";
import { useRouter } from "next/navigation";

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    privacy: "public" | "private" | "invite-only";
    destination: string;
    dateRange: {
      start: Date;
      end?: Date;
      isOngoing: boolean;
    };
    memberCount: number;
    userStatus: "member" | "pending" | "pending_request" | "blocked" | null;
    creator: {
      name: string;
      username: string;
      avatar?: string;
    };
    cover_image?: string;
  };
  onAction: (
    groupId: string,
    action: "view" | "request" | "join"
  ) => Promise<void>;
  isLoading?: boolean;
}

// Client-side image stretch component
interface ImageStretchProps {
  src: string;
  alt: string;
  ariaLabel?: string;
  className?: string;
}

const ImageStretch = ({
  src,
  alt,
  ariaLabel,
  className = "",
}: ImageStretchProps) => {
  return (
    <div className="w-full h-full">
      <img
        src={src}
        alt={alt}
        aria-label={ariaLabel}
        className={`w-full h-full object-fill object-bottom object-right rounded-t-2xl rounded-b-none transition-all duration-500 ${className}`}
        style={{ display: "block" }}
      />
    </div>
  );
};

export function MyGroupCard({
  group,
  onAction,
  isLoading = false,
}: GroupCardProps) {
  const router = useRouter();
  const [actionLoading, setActionLoading] = useState(false);

  const formatDateRange = () => {
    if (group.dateRange.isOngoing) return "Ongoing";
    const startDate = group.dateRange.start.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (!group.dateRange.end) return startDate;
    const endDate = group.dateRange.end.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startDate} - ${endDate}`;
  };

  const formatMemberCount = () => {
    if (group.memberCount === 0) return "No members yet";
    if (group.memberCount === 1) return "1 member";
    if (group.memberCount > 99) return "99+ members";
    return `${group.memberCount} members`;
  };

  const getActionButton = () => {
    if (group.userStatus === "member") {
      return { text: "View Group", variant: "default", action: "view" };
    }
    if (group.userStatus === "pending") {
      return {
        text: "Invitation Pending",
        variant: "secondary",
        action: null,
        disabled: true,
      };
    }
    if (group.userStatus === "pending_request") {
      return {
        text: "Request Pending",
        variant: "secondary",
        action: null,
        disabled: true,
      };
    }
    if (group.userStatus === "blocked") {
      return {
        text: "Unavailable",
        variant: "secondary",
        action: null,
        disabled: true,
      };
    }
    if (group.privacy === "private" || group.privacy === "invite-only") {
      return { text: "Request to Join", variant: "outline", action: "request" };
    }
    return { text: "Join Group", variant: "default", action: "join" };
  };

  const handleAction = async () => {
    const buttonConfig = getActionButton();
    if (!buttonConfig.action || buttonConfig.disabled) return;
    setActionLoading(true);
    try {
      await onAction(
        group.id,
        buttonConfig.action as "view" | "request" | "join"
      );
    } finally {
      setActionLoading(false);
    }
  };

  const buttonConfig = getActionButton();

  if (isLoading) {
    return <GroupCardSkeleton />;
  }

  return (
    <Card className="relative w-full max-w-[600px] h-[350px] rounded-2xl shadow-sm overflow-hidden flex flex-col bg-card text-card-foreground">
      {/* Background Image - now covers full card */}
      <div className="relative w-full h-full overflow-hidden bg-muted">
        <ImageStretch
          src={
            group.cover_image ||
            "https://images.pexels.com/photos/13820406/pexels-photo-13820406.jpeg"
          }
          alt={group.name || "Group cover"}
          ariaLabel={group.name || "Group cover"}
        />
      </div>

      {/* Glassmorphism content overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div
          className="backdrop-blur-2xl bg-gradient-to-t from-black/40 via-black/25 to-transparent"
          style={{
            maskImage:
              "linear-gradient(to top, black 0%, black 98%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, black 98%, transparent 100%)",
          }}
        >
          {/* Content section - keeping your exact structure */}
          <div className="flex flex-col gap-2 px-5 pt-4 pb-4">
            {/* Group name */}
            <div className="flex items-center">
              <span
                className="text-md font-bold leading-tight truncate text-white/80"
                title={group?.name}
              >
                {group?.name}
              </span>
            </div>
            {/* Date/time */}
            <div className="flex items-center gap-2 text-white/80 text-xs font-medium mb-3">
              <Calendar className="w-4 h-4" />
              <span>{formatDateRange?.()}</span>
            </div>
            {/* Destination */}
            <div className="text-white/80 text-xs font-medium flex items-center gap-2">
              <span>{formatMemberCount?.()}</span>
              {/* <Divider orientation="vertical" className="h-4 text-white/60" /> */}
              <span className="h-4 text-white/80">|</span>
              <MapPin className="w-4 h-4 inline-block text-white/80" />
              <span>{group?.destination}</span>
            </div>
            {/* Creator avatar and name */}
            <div className="flex items-center gap-2">
              <Avatar
                src={group?.creator?.avatar}
                alt={group?.creator?.name}
                className="w-4 h-4"
                aria-label={`Avatar of ${group?.creator?.name}`}
              />
              <span className="text-white/80 font-medium text-xs truncate">
                Created by @{group?.creator?.username || "Unknown Creator"}
              </span>
            </div>
          </div>
          {/* Action button(s) at the bottom - keeping your exact logic */}
          <div className="px-5 pb-5 mt-auto">
            <div className="flex gap-2 justify-center items-center">
              <Button
                color="primary"
                className="w-1/3 gap-2 text-xs font-semibold rounded-lg bg-white text-black"
                aria-label="View Group"
                tabIndex={0}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                Itinerary
              </Button>
              <Button
                color="primary"
                className="w-1/3 gap-2 text-xs font-semibold rounded-lg bg-white text-black"
                aria-label="View Group"
                tabIndex={0}
                disabled={actionLoading}
              >
                {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                Chat
              </Button>

              <Button
                color="primary"
                variant="outline"
                className="border-white/30 bg-white/10 hover:bg-white/20 border-1 hover:text-white w-1/3 gap-2 text-xs font-semibold rounded-lg text-white"
                aria-label="Request to Join"
                tabIndex={0}
                disabled={actionLoading}
                onClick={() => router.push(`/groups/${group.id}/home`)}
              >
                {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                View More
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
