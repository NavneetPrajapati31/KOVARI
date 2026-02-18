"use client";

import { useState } from "react";
import { Card, Image } from "@heroui/react";
import { ArrowUp, MapPin } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Avatar } from "@/shared/components/ui/avatar";
import { UserAvatarFallback } from "@/shared/components/UserAvatarFallback";
import { cn } from "@/shared/utils/utils";
import { Skeleton } from "@heroui/react";
import { useRouter } from "next/navigation";

interface DestinationCardProps {
  imageUrl?: string;
  name: string;
  country: string;
  onExplore: () => void;
  forMobile?: boolean;
  forTablet?: boolean;
  isLoading?: boolean;
}



export function TopDestinationCard({
  name,
  country,
  imageUrl,
  onExplore,
  forMobile = false,
  forTablet = false,
  isLoading = false,
}: DestinationCardProps) {
  const [actionLoading, setActionLoading] = useState(false);
  const hasImage = Boolean(imageUrl?.trim());
  const router = useRouter();

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

  if (!name) {
    return (
      <Card
        className="relative w-full h-full min-h-0 rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl shadow-none border border-border overflow-hidden flex flex-col bg-card"
        aria-label="No top destination"
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <MapPin className="w-5 h-5 text-muted-foreground mb-2" aria-hidden />
          <p className="text-xs font-medium text-muted-foreground">
            No top destination
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Your top destination will appear here once you have trips
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`relative w-full h-full rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl shadow-none border border-border overflow-hidden flex flex-col bg-card text-card-foreground`}
    >
      {/* Background Image or empty state fallback (matches GroupCoverCard) */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-muted rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl">
        {imageUrl?.trim() ? (
          <Image
            removeWrapper
            src={imageUrl}
            alt="Top destination"
            className="w-full h-full object-cover object-center transition-all duration-500 rounded-xl sm:rounded-xl md:rounded-xl lg:rounded-xl"
            radius="none"
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
            "font-medium text-[12px] sm:text-xs truncate rounded-3xl px-3 py-2 h-8 text-center max-w-[180px] min-w-0 flex items-center justify-center",
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
          className={cn(
            "rounded-full shrink-0 font-medium h-8 text-[12px] sm:text-xs",
            "bg-transparent hover:bg-transparent hover:text-primary-foreground backdrop-blur-md border border-primary-foreground [transform:translateZ(0)]",
            hasImage
              ? "text-primary-foreground"
              : "text-gray-400 border-gray-400 hover:text-gray-400 hover:bg-gray-400/20"
          )}
          onClick={onExplore}
          aria-label="Explore top destination"
        >
          Top
          <ArrowUp className="w-3.5 h-3.5" />
        </Button>
      </div>
    </Card>
  );
}
