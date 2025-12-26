"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, Card, Image, Skeleton, Divider } from "@heroui/react";
import { MapPin, Calendar, Users, Loader2, ArrowUpRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import GroupCardSkeleton from "@/features/explore/components/GroupCardSkeleton";
import { useRouter } from "next/navigation";

interface DestinationCardProps {
  imageUrl?: string;
  name: string;
  country: string;
  startDate?: string;
  endDate?: string;
  groupId: string;
  onExplore: () => void;
  forMobile?: boolean;
  forTablet?: boolean;
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
        className={`w-full h-full object-fill object-bottom object-right transition-all duration-500 ${className}`}
        style={{ display: "block" }}
      />
    </div>
  );
};

export function UpcomingTripCard({
  name,
  country,
  imageUrl,
  startDate,
  endDate,
  groupId,
  onExplore,
  forMobile = false,
  forTablet = false,
}: DestinationCardProps) {
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();

  // Format dates for display
  const formatTripDates = (start?: string, end?: string): string => {
    if (!start) return "Dates TBD";

    try {
      const startDate = new Date(start);
      const endDate = end ? new Date(end) : null;

      const formatDate = (date: Date) => {
        const month = date.toLocaleDateString("en-US", { month: "short" });
        const day = date.getDate();
        const year = date.getFullYear();
        return `${month} ${day}, ${year}`;
      };

      if (endDate && startDate.getTime() !== endDate.getTime()) {
        // Check if same year, if so omit year from start date
        if (startDate.getFullYear() === endDate.getFullYear()) {
          const startMonth = startDate.toLocaleDateString("en-US", {
            month: "short",
          });
          const startDay = startDate.getDate();
          const endMonth = endDate.toLocaleDateString("en-US", {
            month: "short",
          });
          const endDay = endDate.getDate();
          const year = startDate.getFullYear();

          if (startDate.getMonth() === endDate.getMonth()) {
            return `${startMonth} ${startDay}-${endDay}, ${year}`;
          } else {
            return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
          }
        } else {
          return `${formatDate(startDate)} - ${formatDate(endDate)}`;
        }
      } else {
        return formatDate(startDate);
      }
    } catch (error) {
      return "Dates TBD";
    }
  };

  const tripDates = formatTripDates(startDate, endDate);

  return (
    <Card
      className={`relative w-full h-full rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl shadow-none border-none overflow-hidden flex flex-col bg-card text-card-foreground`}
    >
      {/* Background Image - now covers full card */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-muted rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl">
        <ImageStretch
          src={imageUrl || ""}
          alt={"Group cover"}
          ariaLabel={"Group cover"}
          className="rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl"
        />
      </div>

      {/* Glassmorphism content overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 w-full rounded-b-xl sm:rounded-b-xl md:rounded-b-xl lg:rounded-b-xl">
        <div
          className="backdrop-blur-md w-full rounded-b-xl sm:rounded-b-xl md:rounded-b-xl lg:rounded-b-xl"
          style={{
            maskImage:
              "linear-gradient(to top, black 0%, black 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, black 85%, transparent 100%)",
          }}
        >
          {/* Content section - keeping your exact structure */}
          <div className="flex flex-row gap-1 px-3 py-3">
            {/* Creator avatar and name */}
            <div className="flex flex-col items-start flex-1 min-w-0">
              <span className="text-white font-semibold text-[12px] sm:text-xs truncate w-full">
                {name}, {country}
              </span>
              <span className="text-white font-semibold text-[12px] sm:text-xs truncate w-full">
                {tripDates}
              </span>
            </div>
            <div className="flex justify-end items-end flex-shrink-0">
              <Button
                variant={"outline"}
                size={"sm"}
                className="bg-transparent !text-[11px] p-1 px-2 text-white border-white rounded-full hover:text-white hover:bg-white/20"
                onClick={() => router.push(`/groups/${groupId}/home`)}
              >
                Upcoming
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
