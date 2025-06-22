"use client";

import { useState, useRef, useEffect } from "react";
import { Avatar, Card, Image, Skeleton, Divider } from "@heroui/react";
import { MapPin, Calendar, Users, Loader2, ArrowUpRight } from "lucide-react";
import { Button } from "../ui/button";
import GroupCardSkeleton from "../skeleton/GroupCardSkeleton";
import { useRouter } from "next/navigation";

interface DestinationCardProps {
  imageUrl?: string;
  name: string;
  country: string;
  onExplore: () => void;
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
        className={`w-full h-full object-fill object-bottom object-right rounded-t-2xl rounded-b-none transition-all duration-500 ${className}`}
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
}: DestinationCardProps) {
  const [actionLoading, setActionLoading] = useState(false);

  const router = useRouter();

  return (
    <Card className="relative  w-[250px] h-[200px] rounded-3xl shadow-sm border-3 border-card overflow-hidden flex flex-col bg-card text-card-foreground">
      {/* Background Image - now covers full card */}
      <div className="relative w-full h-full overflow-hidden bg-muted">
        <ImageStretch
          src={imageUrl || ""}
          alt={"Group cover"}
          ariaLabel={"Group cover"}
        />
      </div>

      {/* Glassmorphism content overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <div
          className="backdrop-blur-md"
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
            <div className="flex flex-col items-start gap-0.5 flex-1">
              <span className="text-white font-medium text-xs truncate">
                Mount Fuji
              </span>
              <span className="text-white font-medium text-xs truncate">
                Japan
              </span>
            </div>
            <div className="flex justify-end items-end flex-shrink-0">
              <Button
                variant={"outline"}
                size={"sm"}
                className="bg-transparent text-xs px-5 py-1 text-white border-white rounded-full hover:text-white hover:bg-white/20"
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
