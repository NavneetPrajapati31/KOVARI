"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface GroupContainerProps {
  children: React.ReactNode;
  className?: string;
  shadow?: boolean;
}

export function GroupContainer({ children, className, shadow = false }: GroupContainerProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden",
        "divide-y divide-border",
        shadow && "shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}
