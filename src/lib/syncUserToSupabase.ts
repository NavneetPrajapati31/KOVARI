"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback } from "react";

/**
 * Hook to sync Clerk user to Supabase
 * Uses server-side API endpoint to bypass RLS policies
 */
export function useSyncUserToSupabase() {
  const { userId, getToken } = useAuth();
  const { user } = useUser();

  const syncUser = useCallback(
    async (retries = 3): Promise<boolean> => {
      if (!userId || !user) {
        return false;
      }

      // Per-session guard to avoid re-sync loops
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
        const debugPrefix = "[syncUserToSupabase]";

        // Primary: Server-side sync using the Service Role key
        const syncRes = await fetch("/api/supabase/sync-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (syncRes.ok) {
          const syncResult = await syncRes.json();
          if (syncResult.success) {
            try {
              if (typeof window !== "undefined") {
                sessionStorage.setItem(storageKey, "1");
              }
            } catch {}
            return true;
          }
        }

        // Fallback or retry
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return syncUser(retries - 1);
        }

        console.warn(`${debugPrefix} Sync failed after retries`);
        return false;
      } catch (error) {
        console.error("[syncUserToSupabase] Error in syncUser:", error);
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return syncUser(retries - 1);
        }
        return false;
      }
    },
    [userId, user, getToken]
  );

  return { syncUser };
}

