// -----------------------------------------------------------------------------
//   File : Solo Match Card Component
// -----------------------------------------------------------------------------
// Location: /src/features/explore/components/SoloMatchCard.tsx

"use client";

import React, { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/shared/components/ui/avatar";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  MapPin,
  Calendar,
  User,
  Heart,
  MessageCircle,
  Loader2,
  Briefcase,
  Globe,
  Coffee,
  Star,
  TrendingUp,
  ThumbsDown,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Moon,
  Scale,
  User as UserIcon,
  Ban,
  Beer,
  Wine,
  Coffee as CoffeeIcon,
  Plane,
  Cigarette,
  Wine as Glass,
  Ruler,
  Dumbbell,
  Baby,
  Languages,
  DollarSign,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";

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
  onConnect?: (matchId: string) => Promise<void>;
  onSuperLike?: (matchId: string) => Promise<void>;
  onPass?: (matchId: string) => Promise<void>;
  onComment?: (
    matchId: string,
    attribute: string,
    comment: string
  ) => Promise<void>;
  onViewProfile?: (userId: string) => void;
}

export function SoloMatchCard({
  match,
  onConnect,
  onSuperLike,
  onPass,
  onComment,
  onViewProfile,
}: SoloMatchCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSuperLiking, setIsSuperLiking] = useState(false);
  const [isPassing, setIsPassing] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedAttribute, setSelectedAttribute] = useState<string>("");
  const [commentText, setCommentText] = useState("");

  const handleConnect = async () => {
    if (onConnect) {
      setIsConnecting(true);
      try {
        await onConnect(match.id);
      } finally {
        setIsConnecting(false);
      }
    }
  };

  const handleViewProfile = () => {
    if (onViewProfile) {
      onViewProfile(match.user.userId);
    }
  };

  const handleSuperLike = async () => {
    if (onSuperLike) {
      setIsSuperLiking(true);
      try {
        await onSuperLike(match.id);
      } finally {
        setIsSuperLiking(false);
      }
    }
  };

  const handlePass = async () => {
    if (onPass) {
      setIsPassing(true);
      try {
        await onPass(match.id);
      } finally {
        setIsPassing(false);
      }
    }
  };

  const handleComment = (attribute: string) => {
    setSelectedAttribute(attribute);
    setShowCommentModal(true);
  };

  const handleSubmitComment = async () => {
    if (onComment && commentText.trim()) {
      try {
        await onComment(match.id, selectedAttribute, commentText.trim());
        setShowCommentModal(false);
        setCommentText("");
        setSelectedAttribute("");
      } catch (error) {
        console.error("Error submitting comment:", error);
      }
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
    <div className="w-full h-full flex flex-col overflow-y-auto">
      <div className="flex flex-col gap-6">
        {/* Header Section */}
        <div className="flex items-start gap-4 pb-4 border-b border-border">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
            {match.user.avatar ? (
              <img
                src={match.user.avatar}
                alt={match.user.full_name || match.user.name || "Traveler"}
                className="w-full h-full object-cover cursor-pointer"
              />
            ) : (
              <Avatar className="w-16 h-16 text-lg rounded-full text-primary-foreground">
                <AvatarImage
                  src=""
                  alt={match.user.full_name || match.user.name || "Traveler"}
                />
                <AvatarFallback className="text-primary-foreground font-semibold">
                  {match.user.full_name || match.user.name
                    ? (match.user.full_name || match.user.name)!
                        .charAt(0)
                        .toUpperCase()
                    : "T"}
                </AvatarFallback>
              </Avatar>
            )}
          </div>
          <div className="flex-1 min-w-0">
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
        <div className="flex gap-2 pt-2 pb-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePass}
            disabled={isPassing}
            className="flex-1 h-10 border-destructive/20 text-destructive hover:bg-destructive/10 rounded-full"
          >
            {isPassing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ThumbsDown className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewProfile}
            className="flex-1 h-10 rounded-full"
          >
            <User className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSuperLike}
            disabled={isSuperLiking}
            className="flex-1 h-10 border-pink-200 text-pink-600 hover:bg-pink-50 rounded-full"
          >
            {isSuperLiking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ThumbsUp className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1 h-10 rounded-full"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <MessageCircle className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Comment Modal */}
      <Dialog open={showCommentModal} onOpenChange={setShowCommentModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Comment on {selectedAttribute.replace("_", " ")}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Comment
              </label>
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={`Share your thoughts about ${selectedAttribute.replace("_", " ")}...`}
                className="resize-none"
                rows={4}
                maxLength={200}
              />
              <div className="text-xs text-gray-500 text-right mt-1">
                {commentText.length}/200
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCommentModal(false);
                  setCommentText("");
                  setSelectedAttribute("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitComment}
                disabled={!commentText.trim()}
                className="flex-1"
              >
                Submit Comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
