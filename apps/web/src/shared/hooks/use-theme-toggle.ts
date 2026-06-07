"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function useThemeToggle() {
  const { theme, setTheme, resolvedTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render theme-dependent UI after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = resolvedTheme === "dark";
  const isSystem = theme === "system";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  const setLight = () => setTheme("light");
  const setDark = () => setTheme("dark");
  const setSystem = () => setTheme("system");

  return {
    theme,
    resolvedTheme,
    systemTheme,
    isDark,
    isSystem,
    mounted,
    toggleTheme,
    setLight,
    setDark,
    setSystem,
  };
}
