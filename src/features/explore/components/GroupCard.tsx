"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, Image, Skeleton, Divider, Spinner } from "@heroui/react";
import { MapPin, Calendar, Users, Loader2, Router } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Avatar } from "@/shared/components/ui/avatar";
import { UserAvatarFallback } from "@/shared/components/UserAvatarFallback";
import GroupCardSkeleton from "@/features/explore/components/GroupCardSkeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUserUuidByClerkId } from "@/shared/utils/getUserUuidByClerkId";

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
    userStatus:
      | "member"
      | "pending"
      | "pending_request"
      | "blocked"
      | "declined"
      | null;
    creator: {
      name: string;
      username: string;
      avatar?: string;
    };
    cover_image?: string;
    status?: "active" | "pending" | "removed";
    creatorId?: string;
  };
  onAction: (
    groupId: string,
    action: "view" | "request" | "join"
  ) => Promise<void>;
  isLoading?: boolean;
  onShowLoading?: () => void;
}

export function GroupCard({
  group,
  onAction,
  isLoading = false,
  onShowLoading,
}: GroupCardProps) {
  const router = useRouter();
  const { user } = useUser();
  const [currentUserInternalId, setCurrentUserInternalId] = useState<
    string | null
  >(null);
  const [viewGroupLoading, setViewGroupLoading] = useState(false);
  const [requestToJoinLoading, setRequestToJoinLoading] = useState(false);
  const [userStatus, setUserStatus] = useState(group.userStatus);

  useEffect(() => {
    if (!user?.id) {
      setCurrentUserInternalId(null);
      return;
    }
    let cancelled = false;
    getUserUuidByClerkId(user.id).then((id) => {
      if (!cancelled) setCurrentUserInternalId(id);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const isCreatedByCurrentUser =
    group.creatorId != null &&
    currentUserInternalId != null &&
    group.creatorId === currentUserInternalId;

  const formatDateRange = () => {
    if (!group.dateRange || !group.dateRange.start)
      return "Dates not available";

    if (group.dateRange.isOngoing) return "Ongoing";

    const startDate = new Date(group.dateRange.start).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );

    if (!group.dateRange.end) return startDate;

    const endDate = new Date(group.dateRange.end).toLocaleDateString("en-US", {
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

  /** Show only the city (first part before comma), not state/province/country */
  const formatDestinationCity = (destination: string) => {
    const trimmed = destination?.trim() ?? "";
    if (!trimmed) return trimmed;
    const city = trimmed.split(",")[0]?.trim() ?? trimmed;
    return city;
  };

  const getActionButton = () => {
    // Check if group is pending - show "Under Review" for all users (including creator)
    if (group.status === "pending") {
      return {
        text: "Under Review",
        variant: "secondary",
        action: null,
        disabled: true,
      };
    }
    if (userStatus === "member") {
      return { text: "View Group", variant: "default", action: "view" };
    }
    if (userStatus === "pending") {
      return {
        text: "Invitation Pending",
        variant: "secondary",
        action: null,
        disabled: true,
      };
    }
    if (userStatus === "pending_request") {
      return {
        text: "Request Pending",
        variant: "secondary",
        action: null,
        disabled: true,
      };
    }
    if (userStatus === "blocked") {
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

  const handleRequestToJoin = async () => {
    setRequestToJoinLoading(true);
    try {
      const res = await fetch(`/api/groups/${group.id}/join-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        setRequestToJoinLoading(false);
        return;
      }
      setUserStatus("pending_request");
    } finally {
      setRequestToJoinLoading(false);
    }
  };

  const buttonConfig = getActionButton();

  if (isLoading) {
    return <GroupCardSkeleton />;
  }

  const handleViewGroup = (e: React.MouseEvent) => {
    e.preventDefault();
    setViewGroupLoading(true);
    if (onShowLoading) onShowLoading();
    router.push(`/groups/${group.id}/home`);
  };

  return (
    <Card className="w-full max-w-[400px] h-[330px] rounded-2xl shadow-sm overflow-hidden flex flex-col bg-card border border-border text-card-foreground">
      {/* Top image section or fallback when no cover */}
      <div className="relative w-full h-[160px] overflow-hidden bg-muted">
        {group.cover_image?.trim() ? (
          <Image
            src={group.cover_image}
            alt={group.name || "Group cover"}
            className="w-full h-full object-cover object-top rounded-t-2xl rounded-b-none transition-all duration-500"
            aria-label={group.name || "Group cover"}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary rounded-t-2xl rounded-b-none">
            <Avatar className="w-16 h-16 flex-shrink-0">
              <UserAvatarFallback iconClassName="w-2/3 h-2/3" />
            </Avatar>
          </div>
        )}
      </div>
      {/* Content section */}
      <div className="flex flex-col gap-2 px-5 pt-4">
        {/* Group name */}
        <div className="flex items-center">
          <span
            className="text-sm font-semibold leading-tight truncate text-foreground"
            title={group.name}
          >
            {group.name}
          </span>
        </div>
        {/* Date/time */}
        <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-0 min-w-0">
          <span
            className="truncate min-w-0 flex items-center gap-1"
            title={formatDateRange()}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            {formatDateRange()}
          </span>
          <span className="h-4 text-muted-foreground">|</span>

          <span
            className="capitalize truncate min-w-0 flex items-center gap-1"
            title={formatDestinationCity(group.destination)}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
            {formatDestinationCity(group.destination)}
          </span>
        </div>
        {/* Destination */}
        {/* <div className="text-muted-foreground text-xs font-medium flex items-center gap-2">
          <span>{formatMemberCount()}</span>
        </div> */}
        {/* Creator avatar and name */}
        {group.creator ? (
          <div className="flex items-center gap-2">
            {/* <Avatar
              src={group.creator.avatar || ""}
              alt={group.creator.name || "Creator"}
              className="w-6 h-6 bg-secondary"
              aria-label={`Avatar of ${group.creator.username || "Unknown"}`}
              showFallback={true}
              fallback={
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <rect x="4" y="14" width="16" height="6" rx="3" />
                </svg>
              }
            /> */}
            <span className="text-muted-foreground font-medium text-xs truncate">
              <span>{formatMemberCount()}</span>
              <span className="h-4 text-muted-foreground px-2">|</span>
              {isCreatedByCurrentUser
                ? "Created by you"
                : `Created by @${group.creator.username || "unknown"}`}
            </span>
          </div>
        ) : (
          <div className="text-muted-foreground text-xs">
            {isCreatedByCurrentUser ? "Created by you" : "Created by Unknown"}
          </div>
        )}
      </div>
      {/* Action button(s) at the bottom */}
      <div className="px-5 pb-5 mt-auto">
        {group.status === "pending" ? (
          <Button
            color="primary"
            className="w-full gap-2 text-xs font-semibold rounded-lg"
            aria-label="Under Review"
            tabIndex={0}
            disabled={true}
          >
            Under Review
          </Button>
        ) : userStatus === "member" ? (
          <Button
            color="primary"
            className="w-full gap-2 text-xs font-semibold rounded-lg"
            aria-label="View Group"
            tabIndex={0}
            disabled={viewGroupLoading}
            onClick={handleViewGroup}
          >
            {viewGroupLoading && (
              <Spinner
                variant="spinner"
                size="sm"
                classNames={{ spinnerBars: "bg-primary-foreground" }}
              />
            )}
            View Group
          </Button>
        ) : userStatus === "pending" || userStatus === "blocked" ? (
          <Button
            color="primary"
            className="w-full gap-2 text-xs font-semibold rounded-lg"
            aria-label="status pending"
            tabIndex={0}
            disabled={false}
          >
            {buttonConfig.text}
          </Button>
        ) : userStatus === "pending_request" ? (
          <Button
            color="primary"
            className="w-full gap-2 text-xs font-semibold rounded-lg"
            aria-label="Request Pending"
            tabIndex={0}
            disabled
          >
            Request Pending
          </Button>
        ) : (
          <div className="flex gap-2 justify-center items-center">
            <Button
              color="primary"
              className="w-1/2 gap-2 text-xs font-semibold rounded-lg"
              aria-label="View Group"
              tabIndex={0}
              disabled={viewGroupLoading}
              onClick={handleViewGroup}
            >
              {viewGroupLoading && (
                <Spinner
                  variant="spinner"
                  size="sm"
                  classNames={{ spinnerBars: "bg-primary-foreground" }}
                />
              )}
              View Group
            </Button>
            <Button
              color="primary"
              variant="outline"
              className="border-1 w-1/2 gap-2 text-xs font-semibold rounded-lg"
              aria-label="Request to Join"
              tabIndex={0}
              disabled={requestToJoinLoading}
              onClick={handleRequestToJoin}
            >
              {requestToJoinLoading && (
                <Spinner
                  variant="spinner"
                  size="sm"
                  classNames={{ spinnerBars: "bg-foreground" }}
                />
              )}
              Request to Join
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
