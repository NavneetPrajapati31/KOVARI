"use client";

import { useState } from "react";
import { Card } from "@heroui/react";
import { ArrowUp, MapPin } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
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
          <div className="flex flex-row px-3 py-3">
            {/* Creator avatar and name */}
            <div className="flex flex-col w-full min-w-0">
              <div className="flex flex-row justify-between items-center w-full">
                <span className="text-primary-foreground font-semibold text-[12px] sm:text-xs truncate w-full">
                  Top Destination
                </span>
              </div>
              <span className="text-primary-foreground font-semibold text-[12px] sm:text-xs truncate w-full">
                {name}
              </span>
            </div>
            <div className="flex justify-end items-end flex-shrink-0">
              <Button
                variant={"outline"}
                size={"sm"}
                className="bg-transparent !text-[11px] p-1 px-5 text-white border-white rounded-full hover:text-white hover:bg-white/20"
                onClick={onExplore}
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
