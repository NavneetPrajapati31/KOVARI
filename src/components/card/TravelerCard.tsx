"use client";

import { useState } from "react";
import {
  Divider,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Image,
  Badge,
  Button,
  Skeleton,
} from "@heroui/react";
import {
  Check,
  Heart,
  X,
  Calendar as CalendarIcon,
  MapPin,
  User,
} from "lucide-react";

interface TravelerCardProps {
  traveler: {
    id: string;
    name: string;
    age: number;
    destination: string;
    travelDates: string;
    bio: string;
    profilePhoto: string;
    matchStrength: "high" | "medium" | "low";
  };
  onConnect?: (travelerId: string) => void;
  onViewProfile?: (travelerId: string) => void;
}

const MATCH_COLORS: Record<
  "high" | "medium" | "low",
  "success" | "warning" | "danger"
> = {
  high: "success",
  medium: "warning",
  low: "danger",
};

const MATCH_LABELS = {
  high: "High Match",
  medium: "Medium Match",
  low: "Low Match",
};

export default function TravelerCard({
  traveler,
  onConnect,
  onViewProfile,
}: TravelerCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleConnect = () => {
    onConnect?.(traveler.id);
  };

  const handleViewProfile = () => {
    onViewProfile?.(traveler.id);
  };

  return (
    <Card className="w-full max-w-[300px] rounded-2xl bg-card shadow-lg overflow-hidden flex flex-col">
      {/* Top image section */}
      <div className="relative w-full aspect-[4/2] bg-gray-100">
        {!imageError ? (
          <>
            {!imageLoaded && (
              <Skeleton className="absolute inset-0 w-full h-full rounded-t-2xl" />
            )}
            <Image
              src={
                "https://images.pexels.com/photos/158063/bellingrath-gardens-alabama-landscape-scenic-158063.jpeg"
              }
              alt={`${traveler.name}'s profile photo`}
              width={340}
              height={170}
              className={`w-full h-full object-cover rounded-t-2xl rounded-b-none transition-all duration-500 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              aria-label={`${traveler.name}'s profile photo`}
            />
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-2xl">
            <User className="w-16 h-16 text-default-400" />
          </div>
        )}
        {/* Action buttons */}
        <div className="absolute left-0 -bottom-5 z-10 flex gap-4 pl-5">
          <button
            className="w-9 h-9 rounded-full bg-white border-2 border-green-200 shadow flex items-center justify-center text-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400"
            aria-label="Accept"
            tabIndex={0}
          >
            <Check className="w-5 h-5" />
          </button>
          <button
            className="w-9 h-9 rounded-full bg-white border-2 border-red-300 shadow flex items-center justify-center text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400"
            aria-label="Favorite"
            tabIndex={0}
          >
            <Heart className="w-5 h-5" />
          </button>
          <button
            className="w-9 h-9 rounded-full bg-white border-2 border-orange-200 shadow flex items-center justify-center text-orange-500 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400"
            aria-label="Reject"
            tabIndex={0}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      {/* Content section */}
      <div className="flex flex-col gap-2 px-5 pt-9 pb-6">
        {/* Date/time */}

        {/* Title */}
        <div className="text-lg font-bold text-gray-900 leading-tight">
          {traveler.name}
        </div>
        <div className="flex items-center gap-2 text-purple-700 text-sm font-medium">
          <CalendarIcon className="w-5 h-5" />
          <span>{traveler.travelDates}</span>
        </div>
        {/* Attendance/location */}
        <div className="text-gray-600 text-sm font-medium flex items-center gap-2">
          <span>256 attending</span>
          <Divider orientation="vertical" className="h-4" />
          <MapPin className="w-4 h-4 inline-block text-gray-400" />
          <span>{traveler.destination}</span>
        </div>
      </div>
    </Card>
  );
}
