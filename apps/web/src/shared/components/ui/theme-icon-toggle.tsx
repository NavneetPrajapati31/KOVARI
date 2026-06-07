"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useThemeToggle } from "@/shared/hooks/use-theme-toggle";

export function ThemeIconToggle() {
  const { isDark, toggleTheme, mounted } = useThemeToggle();

  if (!mounted) {
    return <div className="h-9 w-9 rounded-md bg-muted animate-pulse" />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="transition-transform duration-200 active:scale-90"
    >
      {isDark ? (
        <Sun className="h-4 w-4 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-300 rotate-0 scale-100" />
      )}
    </Button>
  );
}
