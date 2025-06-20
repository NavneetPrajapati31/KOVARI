"use client";

import { useState } from "react";
import {
  Avatar,
  Divider,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Image,
  Badge,
  Skeleton,
} from "@heroui/react";
import { Check, Heart, X, Calendar, MapPin, User, Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import TravelerCardSkeleton from "../skeleton/TravelerCardSkeleton";

interface TravelerCardProps {
  traveler: {
    id: string;
    name: string;
    username: string;
    age: number;
    bio: string;
    profilePhoto: string;
    destination: string;
    travelDates: string;
    matchStrength: "high" | "medium" | "low";
  };
  isLoading?: boolean;
}

const MATCH_STRENGTH_LABELS: Record<string, string> = {
  high: "High Match",
  medium: "Medium Match",
  low: "Low Match",
};

const MATCH_STRENGTH_COLORS: Record<string, string> = {
  high: "bg-success text-primary-foreground",
  medium: "bg-warning text-primary-foreground",
  low: "bg-destructive text-primary-foreground",
};

export default function TravelerCard({
  traveler,
  isLoading = false,
}: TravelerCardProps) {
  const [actionLoading, setActionLoading] = useState(false);

  if (isLoading) {
    return <TravelerCardSkeleton />;
  }

  return (
    <Card className="w-full max-w-[600px] h-[240px] rounded-2xl shadow-sm overflow-hidden flex flex-col bg-card text-card-foreground">
      <CardBody className="px-5 py-4 relative">
        {/* Profile Section with Avatar and User Info */}
        <div className="flex items-center gap-4 mb-2">
          {/* Profile Image */}
          <Avatar
            src={traveler.profilePhoto || "/placeholder.svg"}
            alt={`${traveler.name}'s profile`}
            size="md"
          />

          {/* User Info - Right of Avatar */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h2 className="text-md font-bold text-foreground truncate">
              {traveler.name}
            </h2>
            <p className="text-muted-foreground text-xs truncate">
              @{traveler.username}
            </p>
          </div>
        </div>

        <div className="text-left mb-4">
          <p className="text-muted-foreground text-xs leading-relaxed line-clamp-2">
            {traveler.bio}
          </p>
        </div>

        {/* Travel Details */}
        <div className="text-left">
          <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
            <Calendar className="w-4 h-4" />
            <span className="text-xs">{traveler.travelDates}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin
              className="w-4 h-4 text-muted-foreground"
              aria-label="Destination"
            />
            <span className="text-xs text-foreground">
              {traveler.destination}
            </span>
          </div>
        </div>
      </CardBody>
      <div className="px-5 pb-5 mt-auto">
        <div className="flex gap-2 justify-center items-center">
          <Button
            color="primary"
            className="w-1/2 gap-2 font-semibold rounded-lg"
            aria-label="Connect"
            tabIndex={0}
            disabled={actionLoading}
          >
            {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            Connect
          </Button>
          <Button
            color="primary"
            variant="outline"
            className="border-1 w-1/2 gap-2 font-semibold rounded-lg"
            aria-label="View Profile"
            tabIndex={0}
            disabled={actionLoading}
          >
            {actionLoading && <Loader2 className="w-5 h-5 animate-spin" />}
            View Profile
          </Button>
        </div>
      </div>
    </Card>
  );
}
