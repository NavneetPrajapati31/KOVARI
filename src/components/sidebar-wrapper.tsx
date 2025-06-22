"use client";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";

const SIDEBAR_EXCEPTIONS = ["/onboarding*"];

const matchesSidebarException = (pathname: string): boolean => {
  return SIDEBAR_EXCEPTIONS.some((pattern) => {
    if (pattern.endsWith("*")) {
      return pathname.startsWith(pattern.slice(0, -1));
    }
    return pathname === pattern;
  });
};

export const SidebarWrapper = () => {
  const pathname = usePathname();
  if (matchesSidebarException(pathname)) return null;
  return <AppSidebar />;
};
