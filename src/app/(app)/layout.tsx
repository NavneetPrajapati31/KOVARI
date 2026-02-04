"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/shared/components/ui/sidebar";
import { SidebarWrapper } from "@/shared/components/layout/sidebar-wrapper";
import { AppSidebar } from "@/shared/components/layout/app-sidebar";
import LayoutWrapper from "@/shared/components/layout/app-layout-wrapper";
import ProtectedRoute from "@/shared/components/protected-route";
import DirectMessageListener from "@/shared/components/direct-message-listener";
import { BottomNav } from "@/shared/components/layout/bottom-nav";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Logic to hide bottom nav padding on specific routes (must match BottomNav logic)
  const isBottomNavHidden =
    (pathname.startsWith("/chat/") && pathname !== "/chat") ||
    pathname === "/create-group" ||
    (pathname.startsWith("/groups/") && pathname.includes("/chat")) ||
    pathname.startsWith("/onboarding");

  return (
    <>
      <DirectMessageListener />
      <ProtectedRoute>
        <SidebarProvider>
          <SidebarWrapper />
          <main
            className={`flex-1 min-h-0 flex flex-col ${
              isBottomNavHidden ? "pb-0" : "pb-16 md:pb-0"
            }`}
          >
            {children}
          </main>
          <BottomNav />
        </SidebarProvider>
      </ProtectedRoute>
    </>
  );
}
