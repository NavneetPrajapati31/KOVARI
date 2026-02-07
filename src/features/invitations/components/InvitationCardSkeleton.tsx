import React from "react";
import { Card, Skeleton } from "@heroui/react";

export default function InvitationCardSkeleton() {
  return (
    <Card className="w-full max-w-[600px] h-[190px] rounded-xl bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden animate-pulse">
      <div className="px-5 py-4 flex items-center gap-3 mb-2">
        {/* Avatar skeleton */}
        <Skeleton className="w-10 h-10 rounded-full" />
        {/* Name and username skeletons */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <Skeleton className="h-3 w-1/2 rounded" />
          <Skeleton className="h-3 w-1/3 rounded" />
        </div>
      </div>
      {/* Content skeleton */}
      <div className="px-5 flex flex-col gap-2">
        <Skeleton className="h-3 w-1/2 rounded" />
        <Skeleton className="h-3 w-3/3 rounded" />
        {/* <Skeleton className="h-3 w-3/3 rounded" /> */}
      </div>
      {/* Action buttons skeleton */}
      <div className="px-4 pb-5 mt-auto">
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 flex-1 rounded-lg" />
        </div>
      </div>
    </Card>
  );
}
