"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useThemeToggle } from "@/shared/hooks/use-theme-toggle";
import { cn } from "@kovari/utils";
import React from "react";

type ThemeOption = "light" | "dark" | "system";

const options: { value: ThemeOption; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

export function ThemeToggle() {
  const { theme, setLight, setDark, setSystem, mounted } = useThemeToggle();

  // Render a skeleton placeholder until mounted to avoid hydration flash
  if (!mounted) {
    return (
      <div className="h-10 w-full max-w-xs rounded-full bg-muted animate-pulse" />
    );
  }

  const setters: Record<ThemeOption, () => void> = {
    light: setLight,
    dark: setDark,
    system: setSystem,
  };

  return (
    <div
      role="radiogroup"
      aria-label="Theme selection"
      className="inline-flex items-center gap-1 rounded-full bg-secondary p-1 shadow-inner"
    >
      {options.map(({ value, label, Icon }) => {
        const isActive = theme === value;
        return (
          <button
            key={value}
            role="radio"
            aria-checked={isActive}
            aria-label={`${label} theme`}
            onClick={setters[value]}
            className={cn(
              "relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
              "transition-all duration-200 ease-in-out",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
