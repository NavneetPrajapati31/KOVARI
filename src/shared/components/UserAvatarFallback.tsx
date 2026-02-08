import { AvatarFallback } from "@/shared/components/ui/avatar";
import { cn } from "@/shared/utils/utils";
import React from "react";

interface UserAvatarFallbackProps extends React.ComponentPropsWithoutRef<typeof AvatarFallback> {
  iconClassName?: string;
}

export function UserAvatarFallback({ className, iconClassName, ...props }: UserAvatarFallbackProps) {
  return (
    <AvatarFallback
      className={cn("bg-secondary text-foreground text-xs font-medium", className)}
      {...props}
    >
      <svg
        className={cn("w-3/5 h-3/5 text-gray-400", iconClassName)}
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <circle cx="12" cy="8" r="4" />
        <rect x="4" y="14" width="16" height="6" rx="3" />
      </svg>
    </AvatarFallback>
  );
}
