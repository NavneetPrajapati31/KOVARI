// -----------------------------------------------------------------------------
//   File : Solo Match Card Component
// -----------------------------------------------------------------------------
// Location: /src/features/explore/components/SoloMatchCard.tsx

"use client";

import React, { useState } from "react";
import {
  Avatar,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { UserAvatarFallback } from "@/shared/components/UserAvatarFallback";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  MapPin,
  Calendar,
  User,
  Heart,
  Loader2,
  Briefcase,
  Globe,
  Sparkles,
  Moon,
  Scale,
  User as UserIcon,
  Beer,
  Wine,
  Cigarette,
  Wine as Glass,
  Languages,
  DollarSign,
  Flag,
  AlertCircle,
  ThumbsDown,
  Eye,
  X,
} from "lucide-react";
import { Spinner } from "@heroui/react";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  createSoloInterest,
  createSkipRecord,
  createReportRecord,
} from "../lib/matchingActions";

interface SoloMatchCardProps {
  match: {
    id: string;
    name: string;
    destination: string;
    budget: string;
    start_date: Date;
    end_date: Date;
    compatibility_score: number;
    budget_difference: string;
    user: {
      userId: string;
      full_name?: string;
      name?: string;
      age?: number;
      gender?: string;
      personality?: string;
      interests?: string[];
      profession?: string;
      avatar?: string;
      nationality?: string;
      smoking?: string;
      drinking?: string;
      religion?: string;
      languages?: string[];
      location?: { lat: number; lon: number };
      bio?: string;
    };
    is_solo_match: boolean;
  };
  destinationId: string;
  currentUserId: string;
  onInterested?: (toUserId: string, destinationId: string) => Promise<void>;
  onSkip?: (skippedUserId: string, destinationId: string) => Promise<void>;
  onViewProfile?: (userId: string) => void;
  onReport?: (reportedUserId: string, reason: string) => Promise<void>;
  onReportClick?: () => void;
}

export function SoloMatchCard({
  match,
  destinationId,
  currentUserId,
  onInterested,
  onSkip,
  onViewProfile,
  onReport,
  onReportClick,
}: SoloMatchCardProps) {
  const [isInteresting, setIsInteresting] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [interestSent, setInterestSent] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState<string>("");
  const [isReporting, setIsReporting] = useState(false);
  const [isViewingProfile, setIsViewingProfile] = useState(false);

  const handleInterested = async () => {
    if (interestSent) return;

    setIsInteresting(true);
    try {
      // Validate required IDs
      if (!currentUserId || !match.user?.userId) {
        console.error(
          "handleInterested: missing currentUserId or target userId",
          {
            currentUserId,
            targetUserId: match.user?.userId,
          }
        );
        setIsInteresting(false);
        return;
      }

      // Create interest record first
      const result = await createSoloInterest(
        currentUserId,
        match.user.userId,
        destinationId
      );
      if (!result.success) {
        console.error("Failed to create interest:", result.error);
        setIsInteresting(false);
        return;
      }
      
      setInterestSent(true);

      // Call onInterested handler to move to next match
      if (onInterested) {
        await onInterested(match.user.userId, destinationId);
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
      // Validate required IDs
      if (!currentUserId || !match.user?.userId) {
        console.error("handleSkip: missing currentUserId or target userId", {
          currentUserId,
          targetUserId: match.user?.userId,
        });
        setIsSkipping(false);
        return;
      }

      // Create skip record
      const result = await createSkipRecord(
        currentUserId,
        match.user.userId,
        destinationId,
        "solo"
      );
      if (!result.success) {
        console.error("Failed to skip:", result.error);
        setIsSkipping(false);
        return;
      }

      // Call onSkip handler to move to next match
      if (onSkip) {
        await onSkip(match.user.userId, destinationId);
      }

      setIsSkipping(false);
    } catch (error) {
      console.error("Error in handleSkip:", error);
      setIsSkipping(false);
    }
  };

  const handleViewProfile = () => {
    setIsViewingProfile(true);
    if (onViewProfile) {
      onViewProfile(match.user.userId);
    }
  };

  const handleReport = async () => {
    if (!reportReason) return;

    setIsReporting(true);
    try {
      // Use provided handler or fall back to default action
      if (onReport) {
        await onReport(match.user.userId, reportReason);
      } else {
        const result = await createReportRecord(
          currentUserId,
          match.user.userId,
          reportReason,
          "solo"
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
      console.error("Error reporting user:", error);
    } finally {
      setIsReporting(false);
    }
  };

  const formatDateRange = () => {
    const startDate = new Date(match.start_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const endDate = new Date(match.end_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    return `${startDate} - ${endDate}`;
  };

  const getTripLengthDays = () => {
    const start = new Date(match.start_date).getTime();
    const end = new Date(match.end_date).getTime();
    if (isNaN(start) || isNaN(end) || end < start) return null;
    const days = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return days;
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "primary";
  };

  const getBudgetDifferenceColor = (difference: string) => {
    if (difference === "Same budget") return "success";
    if (difference.includes("+")) return "warning";
    return "primary";
  };

  const getPersonalityIcon = (personality?: string) => {
    switch (personality?.toLowerCase()) {
      case "extrovert":
        return <Sparkles className="w-4 h-4" />;
      case "introvert":
        return <Moon className="w-4 h-4" />;
      case "ambivert":
        return <Scale className="w-4 h-4" />;
      default:
        return <UserIcon className="w-4 h-4" />;
    }
  };

  const getSmokingIcon = (smoking?: string) => {
    return <Cigarette className="w-4 h-4 text-muted-foreground" />;
  };

  const getDrinkingIcon = (drinking?: string) => {
    return <Glass className="w-4 h-4 text-muted-foreground" />;
  };

  // Derived display values for Bumble-like sections
  const aboutText = (() => {
    const parts: string[] = [];
    if (match.user.profession)
      parts.push(`${String(match.user.profession).replace(/_/g, " ")}`);
    if (match.user.personality) parts.push(`${String(match.user.personality)}`);
    if (match.user.interests && match.user.interests.length > 0) {
      parts.push(`Loves ${match.user.interests.slice(0, 3).join(", ")}`);
    }
    return parts.length > 0 ? parts.join(". ") + "." : "No bio provided.";
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
    const interests = (match.user.interests || []).map((i) => i.toLowerCase());
    const filtered = interests.filter((i) => candidates.includes(i));
    const tags = (filtered.length > 0 ? filtered : interests).slice(0, 3);
    return tags;
  })();

  const formattedProfession = match.user.profession
    ? String(match.user.profession).replace(/_/g, " ")
    : undefined;
  const languagesList = Array.isArray(match.user.languages)
    ? match.user.languages
    : [];

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
    <div className="w-full h-full flex flex-col overflow-y-auto relative">
      {/* Loading overlay for View Profile */}
      {isViewingProfile && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-card">
          <Spinner variant="spinner" size="md" color="primary" />
        </div>
      )}

      <div
        key={match.id}
        className="flex flex-col gap-6"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start gap-4 pb-4 border-b border-border">
          <div className="w-full aspect-[4/3] md:w-16 md:h-16 md:aspect-auto rounded-3xl md:rounded-full overflow-hidden bg-secondary flex items-center justify-center flex-shrink-0 relative">
            {match.user.avatar ? (
              <img
                src={match.user.avatar}
                alt={match.user.full_name || match.user.name || "Traveler"}
                className="w-full h-full object-cover cursor-pointer"
              />
            ) : (
              <Avatar className="w-full h-full text-lg rounded-none md:rounded-full text-primary-foreground">
                <AvatarImage
                  src=""
                  alt={match.user.full_name || match.user.name || "Traveler"}
                />
              <UserAvatarFallback iconClassName="sm:h-3/5 sm:w-3/5 h-14 w-14" />
              </Avatar>
            )}
          </div>
          <div className="flex-1 min-w-0 w-full">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="text-md font-semibold text-foreground mt-1">
                {match.user.full_name || match.user.name || "Traveler"}
                {match.user.age ? `, ${match.user.age}` : ""}
              </h1>
              {/* <Badge
                variant="default"
                className={`text-xs ${
                  match.compatibility_score >= 80
                    ? "bg-green-100 text-green-800 border-green-200"
                    : match.compatibility_score >= 60
                      ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                      : "bg-blue-100 text-blue-800 border-blue-200"
                }`}
              >
                {match.compatibility_score}% trip overlap
              </Badge> */}
            </div>
            {match.user.bio && (
              <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                {match.user.bio}
              </p>
            )}
            {!match.user.bio && (
              <p className="text-sm text-muted-foreground italic">
                No bio provided.
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
              text={match.destination}
            />
            <Pill
              icon={<Calendar className="w-4 h-4" />}
              text={formatDateRange()}
            />
            <Pill
              icon={<DollarSign className="w-4 h-4" />}
              text={`₹${match.budget}`}
            />
            {getTripLengthDays() && (
              <Pill
                icon={<Calendar className="w-4 h-4" />}
                text={`${getTripLengthDays()} days`}
              />
            )}
          </div>
        </div>

        {/* About Section */}
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">About me</h2>
          <div className="flex flex-wrap gap-2">
            {match.user.gender && (
              <Pill
                icon={<UserIcon className="w-4 h-4" />}
                text={
                  match.user.gender.charAt(0).toUpperCase() +
                  match.user.gender.slice(1)
                }
              />
            )}
            {match.user.nationality && (
              <Pill
                icon={<Globe className="w-4 h-4" />}
                text={match.user.nationality}
              />
            )}
            {formattedProfession && (
              <Pill
                icon={<Briefcase className="w-4 h-4" />}
                text={
                  formattedProfession.charAt(0).toUpperCase() +
                  formattedProfession.slice(1)
                }
              />
            )}
            {match.user.personality && (
              <Pill
                icon={getPersonalityIcon(match.user.personality)}
                text={
                  match.user.personality.charAt(0).toUpperCase() +
                  match.user.personality.slice(1)
                }
              />
            )}
            {languagesList.length > 0 &&
              languagesList.map((lang, i) => (
                <Pill
                  key={i}
                  icon={<Languages className="w-4 h-4" />}
                  text={lang}
                />
              ))}
          </div>
        </div>

        {/* Interests Section */}
        {match.user.interests && match.user.interests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              My interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {match.user.interests.map((interest, i) => (
                <Pill
                  key={i}
                  text={interest.charAt(0).toUpperCase() + interest.slice(1)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Lifestyle Section */}
        <div className="space-y-4 pb-6 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Lifestyle</h2>
          <div className="flex flex-wrap gap-2">
            {match.user.smoking && (
              <Pill
                icon={getSmokingIcon(match.user.smoking)}
                text={
                  match.user.smoking === "no"
                    ? "No"
                    : match.user.smoking === "yes"
                      ? "Yes"
                      : match.user.smoking.charAt(0).toUpperCase() +
                        match.user.smoking.slice(1)
                }
              />
            )}
            {match.user.drinking && (
              <Pill
                icon={getDrinkingIcon(match.user.drinking)}
                text={
                  match.user.drinking === "no"
                    ? "No"
                    : match.user.drinking === "yes"
                      ? "Yes"
                      : match.user.drinking.charAt(0).toUpperCase() +
                        match.user.drinking.slice(1)
                }
              />
            )}
          </div>
        </div>

        {/* Travel Style Section */}
        {/* <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            Travel Style
          </h2>
          <div className="flex flex-wrap gap-2">
            {travelStyleTags.length > 0 ? (
              travelStyleTags.map((t, i) => (
                <Pill key={i} text={t.charAt(0).toUpperCase() + t.slice(1)} />
              ))
            ) : (
              <Pill text="Explorer" />
            )}
          </div>
        </div> */}

        {/* Shared Interests Section */}
        {/* {match.user.interests && match.user.interests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-foreground">
              Shared Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {match.user.interests.slice(0, 8).map((interest, i) => (
                <Pill
                  key={i}
                  text={interest.charAt(0).toUpperCase() + interest.slice(1)}
                />
              ))}
            </div>
          </div>
        )} */}

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3 pt-4 pb-2">
          {/* 1. Skip Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSkip}
            disabled={isSkipping}
            className="md:flex-1 h-11 rounded-full text-foreground bg-background border border-border"
          >
            {isSkipping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <p className="text-md font-bold">Skip</p>
            )}
          </Button>



          {/* 3. View Profile Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewProfile}
            className="md:flex-1 h-11 rounded-full text-foreground bg-background border border-border"
          >
            {/* <Eye className="w-4 h-4" /> */}
            <p className="text-md font-bold">View Profile</p>
          </Button>

          {/* 4. Report Button */}
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
            className="md:flex-1 h-11 rounded-full text-foreground bg-background border border-border"
          >
            {/* <Flag className="w-4 h-4" /> */}
            <p className="text-md font-bold">Report</p>
          </Button>

          {/* 2. Interested Button */}
          <Button
            variant="default"
            size="sm"
            onClick={handleInterested}
            disabled={isInteresting || interestSent}
            className="order-first md:order-none md:flex-1 h-11 rounded-full"
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
                {/* <Heart className="w-4 h-4" /> */}
                <p className="text-md font-bold">Interested</p>
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
              Report User
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Help us keep KOVARI safe. Please select a reason for reporting
              this user.
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
                  <SelectItem value="fake_profile">Fake profile</SelectItem>
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
