// -----------------------------------------------------------------------------
//   File : Group Match Card Component
// -----------------------------------------------------------------------------
// Location: /src/features/explore/components/GroupMatchCard.tsx

"use client";

import React, { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Users,
  MapPin,
  Calendar,
  DollarSign,
  MessageCircle,
  Eye,
  Loader2,
  Plane,
  Globe,
  Star,
  TrendingUp,
  ThumbsDown,
  ThumbsUp,
  User,
  Building2,
  Users2,
  Heart,
  MessageSquare,
  Sparkles,
  Moon,
  Scale,
  User as UserIcon,
  Ban,
  Beer,
  Wine,
  Coffee as CoffeeIcon,
  Cigarette,
  Flag,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  createGroupInterest,
  createSkipRecord,
  createReportRecord,
} from "../lib/matchingActions";

interface GroupMatchCardProps {
  group: any;
  destinationId: string;
  currentUserId: string;
  onInterested?: (groupId: string, destinationId: string) => Promise<void>;
  onSkip?: (groupId: string, destinationId: string) => Promise<void>;
  onViewGroup?: (groupId: string) => void;
  onReport?: (groupId: string, reason: string) => Promise<void>;
}

export function GroupMatchCard({
  group,
  destinationId,
  currentUserId,
  onInterested,
  onSkip,
  onViewGroup,
  onReport,
}: GroupMatchCardProps) {
  const [isInteresting, setIsInteresting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<string>("");
  const [isReporting, setIsReporting] = useState(false);

  console.log("GroupMatchCard received group:", group);

  // Add error boundary for missing group data
  if (!group) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No group data
          </h3>
          <p className="text-gray-600">Please try searching again.</p>
        </div>
      </div>
    );
  }

  const handleJoinGroup = async () => {
    if (interestSent) return;

    setIsInteresting(true);
    try {
      // Use provided handler or fall back to default action
      if (onInterested) {
        await onInterested(group.id, destinationId);
      } else {
        const result = await createGroupInterest(
          currentUserId,
          group.id,
          destinationId
        );
        if (!result.success) {
          console.error("Failed to create interest:", result.error);
          setIsInteresting(false);
          return;
        }
      }
      setInterestSent(true);
    } catch (error) {
      console.error("Error sending interest:", error);
    } finally {
      setIsInteresting(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      // Use provided handler or fall back to default action
      if (onSkip) {
        await onSkip(group.id, destinationId);
      } else {
        const result = await createSkipRecord(
          currentUserId,
          group.id,
          destinationId,
          "group"
        );
        if (!result.success) {
          console.error("Failed to skip:", result.error);
        }
      }
    } catch (error) {
      console.error("Error skipping group:", error);
    } finally {
      setIsSkipping(false);
    }
  };

  const handleViewGroup = () => {
    if (onViewGroup) {
      onViewGroup(group.id);
    }
  };

  const handleReport = async () => {
    if (!reportReason) return;

    setIsReporting(true);
    try {
      // Use provided handler or fall back to default action
      if (onReport) {
        await onReport(group.id, reportReason);
      } else {
        const result = await createReportRecord(
          currentUserId,
          group.id,
          reportReason,
          "group"
        );
        if (!result.success) {
          console.error("Failed to report:", result.error);
          setIsReporting(false);
          return;
        }
      }
      setShowReportDialog(false);
      setReportReason("");
    } catch (error) {
      console.error("Error reporting group:", error);
    } finally {
      setIsReporting(false);
    }
  };

  const formatDateRange = () => {
    if (!group.startDate && !group.endDate) return "Dates TBD";

    try {
      // Handle both string dates and Date objects
      const startDate = group.startDate
        ? typeof group.startDate === "string"
          ? new Date(group.startDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : group.startDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
        : "TBD";

      const endDate = group.endDate
        ? typeof group.endDate === "string"
          ? new Date(group.endDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : group.endDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
        : "TBD";

      return `${startDate} - ${endDate}`;
    } catch (error) {
      console.error("Error formatting dates:", error);
      return "Dates TBD";
    }
  };

  const getTripLengthDays = () => {
    if (!group.startDate || !group.endDate) return null;

    try {
      // Handle both string dates and Date objects
      const start =
        typeof group.startDate === "string"
          ? new Date(group.startDate).getTime()
          : group.startDate.getTime();
      const end =
        typeof group.endDate === "string"
          ? new Date(group.endDate).getTime()
          : group.endDate.getTime();

      if (isNaN(start) || isNaN(end) || end < start) return null;
      const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
      return days;
    } catch (error) {
      console.error("Error calculating trip length:", error);
      return null;
    }
  };

  const getGroupTypeIcon = (privacy?: string) => {
    switch (privacy?.toLowerCase()) {
      case "public":
        return <Globe className="w-4 h-4" />;
      case "private":
        return <Building2 className="w-4 h-4" />;
      default:
        return <Users2 className="w-4 h-4" />;
    }
  };

  const getGroupTypeColor = (privacy?: string) => {
    switch (privacy?.toLowerCase()) {
      case "public":
        return "bg-green-100 text-green-700";
      case "private":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Derived display values for Bumble-like sections
  const aboutText = (() => {
    const parts: string[] = [];
    if (group.creator?.name) parts.push(`Created by ${group.creator.name}`);
    if (group.memberCount) parts.push(`${group.memberCount} members`);
    if (group.destination) parts.push(`Traveling to ${group.destination}`);
    return parts.length > 0
      ? parts.join(". ") + "."
      : "Join this amazing travel group!";
  })();

  const travelStyleTags = (() => {
    const candidates = [
      "cultural",
      "foodie",
      "photography",
      "adventure",
      "nature",
      "nightlife",
      "history",
      "beach",
    ];
    const interests = (group.tags || []).map((i: string) => i.toLowerCase());
    const filtered = interests.filter((i: string) => candidates.includes(i));
    const tags = (filtered.length > 0 ? filtered : interests).slice(0, 3);
    return tags;
  })();

  // Pill component helper
  const Pill = ({
    icon,
    text,
    className = "",
  }: {
    icon?: React.ReactNode;
    text: string;
    className?: string;
  }) => (
    <span
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm bg-background text-foreground border border-border ${className}`}
    >
      {icon && (
        <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center">
          {icon}
        </span>
      )}
      <span>{text}</span>
    </span>
  );

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex items-start gap-4 pb-4 border-b border-border">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            {group.cover_image ? (
              <img
                src={group.cover_image}
                alt={group.name || "Travel Group"}
                className="w-full h-full object-cover cursor-pointer"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Users className="w-8 h-8 text-primary-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-md font-semibold text-foreground mt-1">
                {group.name || "Travel Group"}
              </h1>
            </div>
            {/* <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {group.creator?.name && (
                <span className="capitalize">{group.creator.name}</span>
              )}
            </div> */}
            {group.description && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                {group.description}
              </p>
            )}
            {!group.description && (
              <p className="text-sm text-muted-foreground italic mt-2">
                No description provided.
              </p>
            )}
          </div>
        </div>

        {/* Trip Details Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Trip Details
          </h2>
          <div className="flex flex-wrap gap-2">
            <Pill
              icon={<MapPin className="w-4 h-4" />}
              text={group.destination || "Destination"}
            />
            <Pill
              icon={<Calendar className="w-4 h-4" />}
              text={formatDateRange()}
            />
            {group.budget && (
              <Pill
                icon={<DollarSign className="w-4 h-4" />}
                text={`₹${group.budget.toLocaleString()}`}
              />
            )}
            {getTripLengthDays() && (
              <Pill
                icon={<Calendar className="w-4 h-4" />}
                text={`${getTripLengthDays()} days`}
              />
            )}
          </div>
        </div>

        {/* Match Score Section */}
        {group.score !== undefined && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Match Score
            </h2>
            <div className="flex flex-wrap gap-2">
              <Pill
                icon={<Star className="w-4 h-4" />}
                text={`${Math.round(group.score * 100)}% compatibility`}
              />
              {/* {group.distance !== undefined && (
                <Pill
                  icon={<MapPin className="w-4 h-4" />}
                  text={`${Math.round(group.distance)}km away`}
                />
              )} */}
            </div>
            {group.breakdown && (
              <div className="flex flex-wrap gap-2 mt-2">
                <Pill
                  text={`Budget: ${Math.round(group.breakdown.budget * 100)}%`}
                />
                <Pill
                  text={`Dates: ${Math.round(group.breakdown.dates * 100)}%`}
                />
                <Pill
                  text={`Interests: ${Math.round(group.breakdown.interests * 100)}%`}
                />
                <Pill text={`Age: ${Math.round(group.breakdown.age * 100)}%`} />
              </div>
            )}
          </div>
        )}

        {/* About Section */}
        <div className="space-y-4 pb-6 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">About</h2>
          <div className="flex flex-wrap gap-2">
            {group.creator?.name && (
              <Pill
                icon={<User className="w-4 h-4" />}
                text={`Created by ${group.creator.name}`}
              />
            )}
            {group.memberCount && (
              <Pill
                icon={<Users className="w-4 h-4" />}
                text={`${group.memberCount} members`}
              />
            )}
          </div>
        </div>

        {/* Travel Style Section */}
        {/* <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Travel Style
          </h2>
          <div className="flex flex-wrap gap-2">
            {travelStyleTags.length > 0 ? (
              travelStyleTags.map((tag: string, i: number) => (
                <Pill
                  key={i}
                  text={tag.charAt(0).toUpperCase() + tag.slice(1)}
                />
              ))
            ) : (
              <Pill text="Explorer" />
            )}
          </div>
        </div> */}

        {/* Group Tags Section */}
        {/* {group.tags && group.tags.length > 0 && (
          <div className="space-y-4 pb-6 border-b border-border">
            <h2 className="text-sm font-semibold text-foreground">
              Group Tags
            </h2>
            <div className="flex flex-wrap gap-2">
              {group.tags.slice(0, 8).map((tag: string, i: number) => (
                <Pill
                  key={i}
                  text={tag.charAt(0).toUpperCase() + tag.slice(1)}
                />
              ))}
            </div>
          </div>
        )} */}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSkip}
            disabled={isSkipping}
            className="flex-1 h-10 border-destructive/20 text-destructive hover:bg-destructive/10 rounded-full"
            title="Skip this group"
          >
            {isSkipping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ThumbsDown className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewGroup}
            className="flex-1 h-10 rounded-full"
            title="View group details"
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportDialog(true)}
            className="flex-1 h-10 border-yellow-200 text-yellow-600 hover:bg-yellow-50 rounded-full"
            title="Report this group"
          >
            <Flag className="w-4 h-4" />
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleJoinGroup}
            disabled={isInteresting || interestSent}
            className="flex-1 h-10 rounded-full"
            title="Send interest"
          >
            {isInteresting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : interestSent ? (
              <>
                <Heart className="w-4 h-4 fill-current" />
                <span className="text-xs ml-1">Sent</span>
              </>
            ) : (
              <>
                <Heart className="w-4 h-4" />
                <span className="text-xs ml-1">Interested</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Report Group
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Help us keep KOVARI safe. Please select a reason for reporting
              this group.
            </p>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Reason
              </label>
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a reason..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fake_group">Fake group</SelectItem>
                  <SelectItem value="inappropriate_content">
                    Inappropriate content
                  </SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowReportDialog(false);
                setReportReason("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReport}
              disabled={!reportReason || isReporting}
            >
              {isReporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Reporting...
                </>
              ) : (
                "Report"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
