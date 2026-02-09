"use client";

import { useState, useEffect } from "react";
import { Card } from "@heroui/react";
import { Button } from "@/shared/components/ui/button";
import { Avatar } from "@/shared/components/ui/avatar";
import { UserAvatarFallback } from "@/shared/components/UserAvatarFallback";
import { cn } from "@/shared/utils/utils";
import { Calendar, CalendarClock } from "lucide-react";
import { Skeleton } from "@heroui/react";
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
  isLoading?: boolean;
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
  imageUrl: imageUrlProp,
  startDate,
  endDate,
  groupId,
  onExplore,
  forMobile = false,
  forTablet = false,
  isLoading = false,
}: DestinationCardProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const router = useRouter();

  // Fetch group cover image by groupId (direct fetch as requested)
  useEffect(() => {
    if (!groupId) {
      setCoverImage(null);
      return;
    }
    let cancelled = false;
    fetch(`/api/groups/${groupId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.cover_image) setCoverImage(data.cover_image);
        else if (!cancelled) setCoverImage(null);
      })
      .catch(() => {
        if (!cancelled) setCoverImage(null);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  const imageUrl = coverImage ?? imageUrlProp ?? "";
  const hasImage = Boolean(imageUrl?.trim());

  if (isLoading) {
    return (
      <div
        className="relative w-full h-full min-h-0 rounded-xl overflow-hidden bg-card"
        aria-hidden
        aria-busy
      >
        <Skeleton className="absolute inset-0 size-full rounded-xl" />
      </div>
    );
  }

  if (!name || !groupId) {
    return (
      <Card
        className="relative w-full h-full min-h-0 rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl shadow-none border border-border overflow-hidden flex flex-col bg-card"
        aria-label="No upcoming trip"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <Calendar
            className="w-5 h-5 text-muted-foreground mb-2"
            aria-hidden
          />
          <p className="text-xs font-medium text-muted-foreground">
            No upcoming trip
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Join or create a group to see your next trip
          </p>
        </div>
      </Card>
    );
  }

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
      {/* Background Image or empty state fallback (matches GroupCoverCard) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-muted rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl">
        {imageUrl?.trim() ? (
          <ImageStretch
            src={imageUrl}
            alt="Upcoming trip"
            ariaLabel="Upcoming trip"
            className="rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-secondary rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl border border-border">
            <Avatar className="w-16 h-16 flex-shrink-0">
              <UserAvatarFallback iconClassName="w-2/3 h-2/3" />
            </Avatar>
          </div>
        )}
      </div>

      {/* Content overlay - glassmorphism only on label and button (matches DestinationCard) */}
      <div className="absolute bottom-0 left-0 right-0 z-10 w-full rounded-b-xl sm:rounded-b-xl md:rounded-b-xl lg:rounded-b-xl px-3 py-3 flex flex-row justify-between items-center gap-2">
        <div
          className={cn(
            "font-medium text-[12px] sm:text-xs rounded-3xl px-3 py-2 h-8 flex justify-center items-center max-w-[180px] min-w-0",
            "bg-transparent hover:bg-transparent hover:text-primary-foreground backdrop-blur-md border border-primary-foreground [transform:translateZ(0)] transition-all duration-200",
            hasImage
              ? "text-primary-foreground"
              : "text-gray-400 border-gray-400 hover:text-gray-400 hover:bg-gray-400/20"
          )}
        >
          <span className="truncate">{name}</span>
        </div>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "rounded-full shrink-0 font-medium w-8 h-8",
            "bg-transparent hover:bg-transparent hover:text-primary-foreground backdrop-blur-md border border-primary-foreground [transform:translateZ(0)]",
            hasImage
              ? "text-primary-foreground"
              : "text-gray-400 border-gray-400 hover:text-gray-400 hover:bg-gray-400/20"
          )}
          onClick={() => router.push(`/groups/${groupId}/home`)}
          aria-label="View upcoming trip"
        >
          <CalendarClock className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}
