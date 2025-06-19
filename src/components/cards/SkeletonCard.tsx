import React from "react";
import { Card, Skeleton } from "@heroui/react";

interface SkeletonCardProps {
  card: string;
}

export default function SkeletonCard({ card }: SkeletonCardProps) {
  // Early return for invalid card types
  if (card !== "group" && card !== "traveler") {
    return null;
  }

  if (card === "group") {
    return (
      <Card className="w-full max-w-[360px] h-[350px] rounded-2xl bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden animate-pulse">
        {/* Image skeleton */}
        <div className="relative w-full aspect-[4/2] mb-8">
          <Skeleton className="absolute inset-0 w-full h-full rounded-t-2xl" />
        </div>
        {/* Content skeleton */}
        <div className="px-5 flex flex-col gap-2 mb-2">
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
        <div className="px-5 flex flex-col gap-2">
          <Skeleton className="h-4 w-2/2 rounded" />
          <Skeleton className="h-4 w-3/3 rounded" />
        </div>
        {/* Action button skeleton */}
        <div className="px-5 pb-5 mt-auto">
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </Card>
    );
  }

  if (card === "traveler") {
    return (
      <Card className="w-full max-w-[360px] h-[280px] rounded-2xl bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden animate-pulse">
        <div className="px-5 py-4 flex items-center gap-4 mb-7">
          {/* Avatar skeleton */}
          <Skeleton className="w-14 h-14 rounded-full" />
          {/* Name and username skeletons */}
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
          </div>
        </div>
        {/* Content skeleton */}
        <div className="px-5 flex flex-col gap-2 mb-2">
          <Skeleton className="h-4 w-2/3 rounded" />
        </div>
        <div className="px-5 flex flex-col gap-2">
          <Skeleton className="h-4 w-2/2 rounded" />
          <Skeleton className="h-4 w-3/3 rounded" />
        </div>
        {/* Action buttons skeleton */}
        <div className="px-5 pb-5 mt-auto">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 flex-1 rounded-lg" />
          </div>
        </div>
      </Card>
    );
  }
}
