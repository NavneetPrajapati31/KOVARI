import React from "react";
import { Card, Skeleton } from "@heroui/react";

export default function SkeletonCard() {
  return (
    <Card className="w-full max-w-[320px] h-[350px] rounded-2xl bg-card text-card-foreground shadow-sm flex flex-col overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="relative w-full aspect-[4/2]">
        <Skeleton className="absolute inset-0 w-full h-full rounded-t-2xl" />
      </div>
      {/* Content skeleton */}
      <div className="flex flex-col gap-4 px-5 pt-7 flex-1">
        <Skeleton className="h-4 w-1/3 rounded " />
        <Skeleton className="h-4 w-2/3 rounded" />
        <Skeleton className="h-4 w-2/3 rounded" />
      </div>
      {/* Action button skeleton */}
      <div className="px-5 pb-5 mt-auto">
        <Skeleton className="h-10 w-full rounded-lg" />
      </div>
    </Card>
  );
}
