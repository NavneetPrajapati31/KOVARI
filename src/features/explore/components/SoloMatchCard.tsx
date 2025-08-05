"use client";

import { useState } from "react";
import { Avatar, Card, Badge } from "@heroui/react";
import { MapPin, Calendar, User, Heart, MessageCircle, Loader2 } from "lucide-react";
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
      age?: number;
      gender?: string;
      personality?: string;
      interests?: string[];
      profession?: string;
      avatar?: string;
    };
    is_solo_match: boolean;
  };
  onConnect?: (matchId: string) => Promise<void>;
  onViewProfile?: (userId: string) => void;
}

export function SoloMatchCard({
  match,
  onConnect,
  onViewProfile,
}: SoloMatchCardProps) {
  const [isConnecting, setIsConnecting] = useState(false);

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

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "danger";
  };

  const getBudgetDifferenceColor = (difference: string) => {
    if (difference === "Same budget") return "success";
    if (difference.includes("+")) return "warning";
    return "primary";
  };

  return (
    <Card className="w-full max-w-md mx-auto p-6 space-y-4">
      {/* Header with compatibility score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar
            src={match.user.avatar}
            name={match.user.full_name || "Traveler"}
            size="lg"
            className="w-12 h-12"
          />
          <div>
            <h3 className="font-semibold text-lg">
              {match.user.full_name || "Traveler"}
            </h3>
            <p className="text-sm text-gray-500">
              {match.user.age && `${match.user.age} years`} • {match.user.gender}
            </p>
          </div>
        </div>
        <Badge
          color={getCompatibilityColor(match.compatibility_score)}
          variant="flat"
          className="text-sm font-medium"
        >
          {match.compatibility_score}% Match
        </Badge>
      </div>

      {/* Destination and dates */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-gray-600">
          <MapPin className="w-4 h-4" />
          <span className="font-medium">{match.destination}</span>
        </div>
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{formatDateRange()}</span>
        </div>
      </div>

      {/* Budget information */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Budget:</span>
          <span className="text-sm">{match.budget}</span>
        </div>
        <Badge
          color={getBudgetDifferenceColor(match.budget_difference)}
          variant="flat"
          size="sm"
        >
          {match.budget_difference}
        </Badge>
      </div>

      {/* User details */}
      <div className="space-y-2">
        {match.user.personality && (
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-500" />
            <span className="text-sm capitalize">{match.user.personality}</span>
          </div>
        )}
        {match.user.profession && (
          <div className="text-sm text-gray-600">
            💼 {match.user.profession}
          </div>
        )}
        {match.user.interests && match.user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {match.user.interests.slice(0, 3).map((interest, index) => (
              // FIX: Changed variant from "bordered" to "flat"
              <Badge key={index} variant="flat" size="sm">
                {interest}
              </Badge>
            ))}
            {match.user.interests.length > 3 && (
              // FIX: Changed variant from "bordered" to "flat"
              <Badge variant="flat" size="sm">
                +{match.user.interests.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex space-x-2 pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleViewProfile}
          className="flex-1"
        >
          <User className="w-4 h-4 mr-2" />
          View Profile
        </Button>
        <Button
          color="primary"
          size="sm"
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex-1"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <MessageCircle className="w-4 h-4 mr-2" />
          )}
          Connect
        </Button>
      </div>
    </Card>
  );
}
