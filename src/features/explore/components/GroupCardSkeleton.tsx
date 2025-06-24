import React from "react";
import { Card, Skeleton } from "@heroui/react";

export default function GroupCardSkeleton() {
  return (
    <Card className="w-full max-w-[600px] h-[350px] rounded-2xl bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="relative w-full h-[160px] overflow-hidden mb-10">
        <Skeleton className="absolute inset-0 w-full h-full rounded-t-2xl" />
      </div>
      {/* Content skeleton */}
      <div className="px-5 flex flex-col gap-2 mb-2">
        <Skeleton className="h-3 w-2/3 rounded" />
      </div>
      <div className="px-5 flex flex-col gap-2">
        <Skeleton className="h-3 w-2/2 rounded" />
        <Skeleton className="h-3 w-3/3 rounded" />
      </div>
      {/* Action button skeleton */}
      <div className="px-4 pb-5 mt-auto">
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    </Card>
  );
}
