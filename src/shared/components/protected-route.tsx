"use client";

import type React from "react";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Spinner } from "@heroui/react";
import { useSyncUserToSupabase } from "@/lib/syncUserToSupabase";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const { syncUser } = useSyncUserToSupabase();
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const syncUserAccount = async () => {
        setIsSyncing(true);
        try {
          await syncUser();
        } catch (error) {
          console.error("Failed to sync user:", error);
        } finally {
          setIsSyncing(false);
        }
      };
      
      syncUserAccount();
    }
  }, [isLoaded, isSignedIn, syncUser]);

  if (!isLoaded || isSyncing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-card h-screen">
        <Spinner variant="spinner" size="md" color="primary" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return <>{children}</>;
}
