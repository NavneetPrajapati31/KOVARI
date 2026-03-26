"use client";

import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  onClear?: () => void;
}

export function SearchInput({ className, containerClassName, onClear, value, ...props }: SearchInputProps) {
  return (
    <div className={cn("relative w-full", containerClassName)}>
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
      <input
        {...props}
        value={value}
        type="search"
        className={cn(
          "flex h-10 w-full rounded-xl bg-card border border-border px-3 py-1 text-sm shadow-none transition-all outline-none pl-10 pr-10",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-0",
          "[&::-webkit-search-cancel-button]:appearance-none",
          "[&::-webkit-search-decoration]:appearance-none",
          className
        )}
      />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-muted-foreground/50 transition-colors z-20 cursor-pointer"
        >
          <X className="h-4.5 w-4.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
