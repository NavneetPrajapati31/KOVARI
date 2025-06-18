"use client";

import { useState } from "react";
import { Card, Image, Skeleton, Divider } from "@heroui/react";
import { Avatar } from "@/components/ui/avatar";
import { MapPin, Calendar, Users, Loader2 } from "lucide-react";
import type { GroupCardProps } from "@/types/group";
import SkeletonCard from "./SkeletonCard";

export function GroupCard({
  group,
  onAction,
  isLoading = false,
}: GroupCardProps) {
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
    return <SkeletonCard />;
  }

  return (
    <Card className="w-full max-w-[320px] max-h-[350px] rounded-2xl shadow-sm overflow-hidden flex flex-col bg-card text-card-foreground">
      {/* Top image section */}
      <div className="relative w-full h-[140px] overflow-hidden bg-muted">
        <Image
          src={
            (group as any).coverImage ||
            "https://images.pexels.com/photos/158063/bellingrath-gardens-alabama-landscape-scenic-158063.jpeg"
          }
          alt={group.name || "Group cover"}
          className="w-full h-full object-cover object-top rounded-t-2xl rounded-b-none transition-all duration-500"
          aria-label={group.name || "Group cover"}
        />
      </div>
      {/* Content section */}
      <div className="flex flex-col gap-2 px-5 pt-4 pb-4">
        {/* Group name */}
        <div className="flex items-center">
          <span
            className="text-lg font-bold leading-tight truncate text-foreground"
            title={group.name}
          >
            {group.name}
          </span>
        </div>
        {/* Date/time */}
        <div className="flex items-center gap-2 text-primary text-sm font-medium mb-3">
          <Calendar className="w-5 h-5" />
          <span>{formatDateRange()}</span>
        </div>
        {/* Destination */}
        <div className="text-muted-foreground text-sm font-medium flex items-center gap-2">
          <span>{formatMemberCount()}</span>
          <Divider
            orientation="vertical"
            className="h-4 text-muted-foreground"
          />
          <MapPin className="w-4 h-4 inline-block text-muted-foreground" />
          <span>{group.destination}</span>
        </div>
        {/* Creator avatar and name */}
        <div className="flex items-center">
          <span className="text-muted-foreground font-medium text-sm truncate">
            Created by {group.creator.name || "Unknown Creator"}
          </span>
        </div>
      </div>
      {/* Action button(s) at the bottom */}
      <div className="px-5 pb-5 mt-auto">
        {group.userStatus === "member" ? (
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-60 disabled:cursor-not-allowed bg-primary text-primary-foreground hover:bg-primary-hover"
            aria-label="View Group"
            tabIndex={0}
            onClick={() => onAction(group.id, "view" as "view")}
            disabled={actionLoading}
          >
            {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            View Group
          </button>
        ) : group.userStatus === "pending" || group.userStatus === "blocked" ? (
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-base transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-muted disabled:opacity-60 disabled:cursor-not-allowed bg-muted text-muted-foreground"
            aria-label={buttonConfig.text}
            tabIndex={0}
            disabled
          >
            {buttonConfig.text}
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              className="w-1/2 flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="View Group"
              tabIndex={0}
              onClick={() => onAction(group.id, "view" as "view")}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              View Group
            </button>
            <button
              type="button"
              className="w-1/2 flex items-center justify-center gap-2 rounded-lg px-3 py-1 font-semibold text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary border border-primary text-primary bg-white hover:bg-primary-hover/10 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-label="Request to Join"
              tabIndex={0}
              onClick={() =>
                onAction(
                  group.id,
                  (group.privacy === "public" ? "join" : "request") as
                    | "join"
                    | "request"
                )
              }
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
              Request to Join
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
