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

export function DestinationCard({
  name,
  country,
  imageUrl,
  onExplore,
  forMobile = false,
  forTablet = false,
}: DestinationCardProps) {
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();

  return (
    <Card
      className={`relative ${forMobile === true ? "w-full h-[180px]" : forTablet === true ? "w-full h-[220px] " : "w-[250px] h-[200px]"}  rounded-3xl sm:rounded-3xl md:rounded-3xl lg:rounded-3xl shadow-sm border-3 border-card overflow-hidden flex flex-col bg-card text-card-foreground`}
    >
      {/* Background Image - now covers full card */}
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-muted rounded-3xl sm:rounded-3xl md:rounded-3xl lg:rounded-3xl">
        <ImageStretch
          src={imageUrl || ""}
          alt={"Group cover"}
          ariaLabel={"Group cover"}
          className="rounded-3xl sm:rounded-3xl md:rounded-3xl lg:rounded-3xl"
        />
      </div>

      {/* Glassmorphism content overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10 w-full rounded-b-3xl sm:rounded-b-3xl md:rounded-b-3xl lg:rounded-b-3xl">
        <div
          className="backdrop-blur-md w-full rounded-b-3xl sm:rounded-b-3xl md:rounded-b-3xl lg:rounded-b-3xl"
          style={{
            maskImage:
              "linear-gradient(to top, black 0%, black 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to top, black 0%, black 85%, transparent 100%)",
          }}
        >
          {/* Content section - keeping your exact structure */}
          <div className="flex flex-row gap-1 px-4 py-3">
            {/* Creator avatar and name */}
            <div className="flex flex-col items-start flex-1">
              <span className="text-white font-semibold text-[12px] sm:text-xs truncate">
                {name}
              </span>
              <span className="text-white font-semibold text-[12px] sm:text-xs truncate">
                {country}
              </span>
            </div>
            <div className="flex justify-end items-end flex-shrink-0">
              <Button
                variant={"outline"}
                size={"sm"}
                className="bg-transparent text-xs px-5 py-1 text-white border-white rounded-full hover:text-white hover:bg-white/20"
                onClick={onExplore}
              >
                Explore
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
