"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useAuth, useUser } from "@clerk/nextjs";
import { useCallback } from "react";

// This assumes you already have a Supabase client setup in /lib/supabase.ts
export function useSyncUserToSupabase() {
  const { getToken, userId } = useAuth();
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
        const token = await getToken();

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        );

        // Try to get the user to check if they exist
        const { data: existingUser, error: fetchError } = await supabase
          .from("users")
          .select("id")
          .eq("clerk_user_id", userId)
          .single();

        // If fetchError is not a "no rows" error, log and retry
        if (fetchError && fetchError.code !== "PGRST116") {
          console.error("Error checking user existence:", fetchError);
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return syncUser(retries - 1);
          }
          return false;
        }

        // If user doesn't exist (either fetchError is "no rows" or data is null), try to create
        let userIdInSupabase = existingUser?.id;
        if (!existingUser) {
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({ clerk_user_id: userId })
            .select("id")
            .single();

          if (insertError || !newUser) {
            console.error("Failed to create user in Supabase:", insertError);
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              return syncUser(retries - 1);
            }
            return false;
          }
          userIdInSupabase = newUser.id;
        }

        if (!userIdInSupabase) {
          console.error("User ID in Supabase is undefined after sync.");
          return false;
        }

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
    [userId, user, getToken]
  );

  return { syncUser };
}
