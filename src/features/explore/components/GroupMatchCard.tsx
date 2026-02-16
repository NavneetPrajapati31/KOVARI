// -----------------------------------------------------------------------------
//   File : Group Match Card Component
// -----------------------------------------------------------------------------
// Location: /src/features/explore/components/GroupMatchCard.tsx

"use client";

import React, { useState } from "react";
import { Avatar, AvatarImage } from "@/shared/components/ui/avatar";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Users,
  MapPin,
  Calendar,
  MessageCircle,
  Loader2,
  Globe,
  Star,
  UserCircle2,
  Users2,
  Heart,
  Flag,
  AlertCircle,
  X,
  Check,
  IndianRupee,
  Cigarette,
  Wine as Glass,
} from "lucide-react";
import { Spinner } from "@heroui/react";
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
import { UserAvatarFallback } from "@/shared/components/UserAvatarFallback";

interface GroupMatchCardProps {
  group: any;
  destinationId: string;
  currentUserId: string;
  onInterested?: (groupId: string, destinationId: string) => Promise<void>;
  onSkip?: (groupId: string, destinationId: string) => Promise<void>;
  onViewGroup?: (groupId: string) => void;
  onReport?: (groupId: string, reason: string) => Promise<void>;
  onReportClick?: () => void;
}

export function GroupMatchCard({
  group,
  destinationId,
  currentUserId,
  onInterested,
  onSkip,
  onViewGroup,
  onReport,
  onReportClick,
}: GroupMatchCardProps) {
  const [isInteresting, setIsInteresting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<string>("");
  const [isReporting, setIsReporting] = useState(false);
  const [isViewingGroup, setIsViewingGroup] = useState(false);

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
      // Create interest record first
      const result = await createGroupInterest(
        currentUserId,
        group.id,
        destinationId,
      );
      if (!result.success) {
        console.error("Failed to create interest:", result.error);
        setIsInteresting(false);
        return;
      }

      setInterestSent(true);

      // Call onInterested handler to move to next match
      if (onInterested) {
        await onInterested(group.id, destinationId);
      }

      setIsInteresting(false);
    } catch (error) {
      console.error("Error sending interest:", error);
      setIsInteresting(false);
    }
  };

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      // Create skip record
      const result = await createSkipRecord(
        currentUserId,
        group.id,
        destinationId,
        "group",
      );
      if (!result.success) {
        console.error("Failed to skip:", result.error);
        setIsSkipping(false);
        return;
      }

      // Call onSkip handler to move to next match
      if (onSkip) {
        await onSkip(group.id, destinationId);
      }

      setIsSkipping(false);
    } catch (error) {
      console.error("Error in handleSkip:", error);
      setIsSkipping(false);
    }
  };

  const handleViewGroup = () => {
    setIsViewingGroup(true);
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
          "group",
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

  const getPrivacyIcon = (privacy?: string) => {
    switch (privacy?.toLowerCase()) {
      case "public":
        return <Globe />;
      case "private":
        return <Users2 />;
      default:
        return <Globe />;
    }
  };

  const formatSmokingPolicy = (p?: string) => {
    if (!p) return null;
    const s = p.toLowerCase();
    if (s === "non-smoking") return "No smoking";
    if (s === "smokers welcome") return "Smoking allowed";
    return "Smoking flexible";
  };

  const formatDrinkingPolicy = (p?: string) => {
    if (!p) return null;
    const s = p.toLowerCase();
    if (s === "non-drinking") return "No alcohol";
    if (s === "drinkers welcome") return "Alcohol allowed";
    return "Alcohol flexible";
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

  // Pill component helper - modern SaaS styling (matches SoloMatchCard)
  const Pill = ({
    icon,
    text,
    variant = "default",
    className = "",
  }: {
    icon?: React.ReactNode;
    text: string;
    variant?: "default" | "highlight";
    className?: string;
  }) => (
    <span
      className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm bg-background text-foreground border border-border ${className}`}
    >
      {icon && (
        <span className="flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4 [&_svg]:shrink-0 [&_svg]:text-current">
          {icon}
        </span>
      )}
      <span>{text}</span>
    </span>
  );

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto relative">
      <div key={group.id} className="flex flex-col gap-5">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start gap-4 pb-5 border-b border-border/60">
          <div className="w-full aspect-[4/3] md:w-16 md:h-16 md:aspect-auto rounded-2xl md:rounded-full overflow-hidden bg-muted/60 flex items-center justify-center flex-shrink-0 relative shadow-sm">
            {group.cover_image ? (
              <img
                src={group.cover_image}
                alt={group.name || "Travel Group"}
                className="w-full h-full object-cover cursor-pointer"
              />
            ) : (
              <Avatar className="w-full h-full text-lg rounded-none md:rounded-full text-primary-foreground">
                <AvatarImage src="" alt={group.name || "Travel Group"} />
                <UserAvatarFallback iconClassName="sm:h-3/5 sm:w-3/5 h-14 w-14" />
              </Avatar>
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
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Trip Details
          </h2>
          <div className="flex flex-wrap gap-2">
            <Pill
              icon={<MapPin />}
              text={
                typeof group.destination === "string"
                  ? group.destination.split(",")[0]?.trim() || group.destination
                  : "Destination"
              }
            />
            <Pill icon={<Calendar />} text={formatDateRange()} />
            {getTripLengthDays() && (
              <Pill icon={<Calendar />} text={`${getTripLengthDays()} days`} />
            )}
            {group.budget != null && (
              <Pill
                icon={<IndianRupee />}
                text={`${Number(group.budget).toLocaleString("en-IN")} per person`}
                variant="highlight"
              />
            )}
          </div>
        </div>

        {/* Match Score Section */}
        {/* {group.score !== undefined && (
          <div className="space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Match Score
            </h2>
            <div className="flex flex-wrap gap-2">
              <Pill
                icon={<Star />}
                text={`${Math.round(group.score * 100)}% compatibility`}
              />
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
        )} */}

        {/* About Section */}
        <div
          className={`space-y-4 ${!(group.smokingPolicy || group.drinkingPolicy) ? "pb-6 border-b border-border/60" : ""}`}
        >
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            About
          </h2>
          <div className="flex flex-wrap gap-2">
            {group.creator?.name && (
              <Pill
                icon={<UserCircle2 />}
                text={`Created by ${group.creator.name}`}
              />
            )}
            {group.memberCount != null && (
              <Pill icon={<Users />} text={`${group.memberCount} members`} />
            )}
          </div>
        </div>

        {/* Group Interests / Tags Section */}
        {group.tags && group.tags.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Group interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {group.tags.slice(0, 6).map((tag: string, i: number) => (
                <Pill
                  key={i}
                  text={tag.charAt(0).toUpperCase() + tag.slice(1)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Languages Section */}
        {group.languages && group.languages.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Languages
            </h2>
            <div className="flex flex-wrap gap-2">
              {group.languages.map((lang: string, i: number) => (
                <Pill key={i} icon={<MessageCircle />} text={lang} />
              ))}
            </div>
          </div>
        )}

        {/* Lifestyle Section */}
        {(group.smokingPolicy || group.drinkingPolicy) && (
          <div className="space-y-4 pb-6 border-b border-border/60">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Group lifestyle
            </h2>
            <div className="flex flex-wrap gap-2">
              {formatSmokingPolicy(group.smokingPolicy) && (
                <Pill
                  icon={<Cigarette strokeWidth={2} />}
                  text={formatSmokingPolicy(group.smokingPolicy)!}
                />
              )}
              {formatDrinkingPolicy(group.drinkingPolicy) && (
                <Pill
                  icon={<Glass strokeWidth={2} />}
                  text={formatDrinkingPolicy(group.drinkingPolicy)!}
                />
              )}
            </div>
          </div>
        )}

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
        <div className="flex flex-row gap-2 pt-4 pb-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSkip}
            disabled={isSkipping}
            className="flex-1 h-11 rounded-full text-foreground bg-background border border-border"
          >
            {isSkipping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <X className="w-5 h-5 md:hidden shrink-0" aria-hidden />
                <span className="hidden md:inline text-md font-bold">Skip</span>
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              if (onReportClick) {
                onReportClick();
              } else {
                setShowReportDialog(true);
              }
            }}
            className="flex-1 h-11 rounded-full text-foreground bg-background border border-border"
          >
            <Flag className="w-5 h-5 md:hidden shrink-0" aria-hidden />
            <span className="hidden md:inline text-md font-bold">Report</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleJoinGroup}
            disabled={isInteresting || interestSent}
            className="order-first md:order-none flex-1 h-11 rounded-full"
          >
            {isInteresting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : interestSent ? (
              <>
                <Heart
                  className="w-5 h-5 fill-current md:hidden shrink-0"
                  aria-hidden
                />
                <span className="hidden md:inline text-xs ml-1">Sent</span>
              </>
            ) : (
              <>
                <Check className="w-5 h-5 md:hidden shrink-0" aria-hidden />
                <span className="hidden md:inline text-md font-bold">
                  Interested
                </span>
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
