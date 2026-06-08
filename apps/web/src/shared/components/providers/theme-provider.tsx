"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes";
import { usePathname } from "next/navigation";

const MARKETING_ROUTES = [
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/community-guidelines",
  "/user-safety",
  "/data-deletion"
];

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const pathname = usePathname();
  const isMarketing = MARKETING_ROUTES.includes(pathname);

  return (
    <NextThemesProvider 
      {...props} 
      forcedTheme={isMarketing ? "light" : undefined}
    >
      {children}
    </NextThemesProvider>
  );
}
