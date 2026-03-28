"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminTopbar } from "@/components/AdminTopbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { useAuth } from "@clerk/nextjs";

// Global loading state context
type LoadingContextType = {
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  isNavigating: boolean;
  setIsNavigating: (val: boolean) => void;
};

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  setIsLoading: () => {},
  isNavigating: false,
  setIsNavigating: () => {},
});

export const useLoading = () => useContext(LoadingContext);

export function AdminLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { isLoaded, isSignedIn } = useAuth();
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Reset states on path change
  useEffect(() => {
    setIsNavigating(false);
    setIsLoading(false); // Also clear manual loading state on navigation
  }, [pathname]);

  useEffect(() => {
    // ... (rest of the login logging logic remains same)
    const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/not-authorized");
    
    if (isLoaded && isSignedIn && !isAuthPage && typeof window !== 'undefined') {
      const pendingLogin = sessionStorage.getItem("admin_login_pending");
      
      if (pendingLogin) {
        sessionStorage.removeItem("admin_login_pending");
        
        fetch('/api/admin/auth/log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login' }),
        }).catch(err => {
          console.error("Failed to log login action:", err);
        });
      }
    }
  }, [isLoaded, isSignedIn, pathname]);

  const isAuthPage =
    pathname?.startsWith("/sign-in") || pathname?.startsWith("/not-authorized");

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Combine both states for the final overlay visibility
  const showLoader = isNavigating || isLoading;

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading, isNavigating, setIsNavigating }}>
      <SidebarProvider defaultOpen={false}>
        <AdminSidebar setIsNavigating={setIsNavigating} />
        <SidebarInset className="relative flex flex-col bg-background">
          {showLoader && (
            <div className="absolute inset-0 z-[50] flex items-center justify-center h-[100vh] bg-background transition-all duration-300">
               <div className="flex flex-col items-center">
                  <Loader2 className="h-6 w-6 text-primary animate-spin" />
               </div>
            </div>
          )}
          <AdminTopbar />
          <main className={cn("flex-1 overflow-auto p-6 md:p-8 md:pt-6", showLoader && "hidden")}>
            <div className="max-w-[1600px] mx-auto space-y-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </LoadingContext.Provider>
  );
}
