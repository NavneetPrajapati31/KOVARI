"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback } from "react";

/**
 * Hook to sync Clerk user to Supabase
 * Uses server-side API endpoint to bypass RLS policies
 */
export function useSyncUserToSupabase() {
  const { userId } = useAuth();
  const { user } = useUser();

  const syncUser = useCallback(
    async (retries = 3): Promise<boolean> => {
      if (!userId || !user) {
        console.warn("Clerk user not found");
        return false;
      }

      // Per-session guard to avoid re-sync loops on re-renders/navigation
      const storageKey = `supabase-sync:${userId}`;
      try {
        if (
          typeof window !== "undefined" &&
          sessionStorage.getItem(storageKey) === "1"
        ) {
          return true;
        }
      } catch {}

      try {
        // Use server-side API endpoint to sync user (bypasses RLS)
        // This is more secure and reliable than direct client-side inserts
        const syncResponse = await fetch("/api/users/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ clerkUserId: userId }),
        });

        if (!syncResponse.ok) {
          const errorData = await syncResponse.json().catch(() => ({}));
          console.warn("Failed to sync user to Supabase:", errorData.error || syncResponse.statusText);
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return syncUser(retries - 1);
          }
          return false;
        }

        const syncResult = await syncResponse.json();
        if (!syncResult.success || !syncResult.userId) {
          console.warn("User sync returned invalid result:", syncResult);
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return syncUser(retries - 1);
          }
          return false;
        }

        const userIdInSupabase = syncResult.userId;

        // Mark as synced for the session
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(storageKey, "1");
          }
        } catch {}

        console.log("✅ User synced to Supabase successfully");
        return true;
      } catch (error) {
        console.error("Error in syncUser:", error);
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return syncUser(retries - 1);
        }
        return false;
      }
    },
    [userId, user]
  );

  return { syncUser };
}
