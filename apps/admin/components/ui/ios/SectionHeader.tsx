import React from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionHeader({ children, className }: SectionHeaderProps) {
  return (
    <h3
      className={cn(
        "px-4 pb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70",
        className
      )}
    >
      {children}
    </h3>
  );
}
