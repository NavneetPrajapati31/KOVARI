"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminTopbar } from "@/components/AdminTopbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

import { useAuth } from "@clerk/nextjs";

export function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    // Check if we have a pending login action to log
    // Only log if we are authenticated and NOT on an auth page (to avoid premature logging)
    const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/not-authorized");
    
    if (isLoaded && isSignedIn && !isAuthPage && typeof window !== 'undefined') {
      const pendingLogin = sessionStorage.getItem("admin_login_pending");
      
      if (pendingLogin) {
        // Clear flag immediately to prevent double logging
        sessionStorage.removeItem("admin_login_pending");
        
        fetch('/api/admin/auth/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login' }),
        }).catch(err => {
          console.error("Failed to log login action:", err);
          // Optionally restore flag if we want to retry, but better to fail safe
        });
      }
    }
  }, [isLoaded, isSignedIn, pathname]);

  // Don't show admin layout on auth pages
  const isAuthPage =
    pathname?.startsWith("/sign-in") || pathname?.startsWith("/not-authorized");

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AdminSidebar />
      <SidebarInset className="flex flex-col">
        <AdminTopbar />
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
