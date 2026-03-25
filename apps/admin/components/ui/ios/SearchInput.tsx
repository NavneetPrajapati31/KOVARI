"use client";

import React from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export function SearchInput({ className, containerClassName, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative w-full", containerClassName)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
      <input
        {...props}
        className={cn(
          "h-10 w-full rounded-full bg-muted/60 pl-10 pr-4 text-[15px]",
          "placeholder:text-muted-foreground/50",
          "focus:outline-none focus:ring-1 focus:ring-primary/20",
          "transition-shadow",
          className
        )}
      />
    </div>
  );
}
