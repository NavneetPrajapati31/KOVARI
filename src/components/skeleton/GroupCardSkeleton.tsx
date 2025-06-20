import React from "react";
import { Card, Skeleton } from "@heroui/react";

export default function GroupCardSkeleton() {
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
