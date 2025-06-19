import React from "react";
import { Card, Skeleton } from "@heroui/react";

export default function TravelerCardSkeleton() {
  return (
    <Card className="w-full max-w-[360px] h-[265px] rounded-2xl bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden animate-pulse">
      <div className="px-5 py-4 flex items-center gap-4 mb-5">
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
