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
        // console.warn("Clerk user not found");
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
        const debugPrefix = "[syncUserToSupabase]";

        // Prefer server-side sync using the Service Role key (bypasses RLS safely).
        // This avoids requiring INSERT policies on the public.users mapping table.
        try {
          const syncRes = await fetch("/api/supabase/sync-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
          });

          if (syncRes.ok) {
            // Mark as synced for the session
            try {
              if (typeof window !== "undefined") {
                sessionStorage.setItem(storageKey, "1");
              }
            } catch {}

            return true;
          }

          const body = await syncRes.json().catch(() => null);
          // console.warn(`${debugPrefix} Server sync failed`, {
          //   status: syncRes.status,
          //   body,
          // });
        } catch (e) {
          // console.warn(`${debugPrefix} Server sync threw`, e);
        }

        // IMPORTANT: Use the Supabase JWT template so the token includes
        // `role: "authenticated"` and is signed for Supabase verification.
        const token = await getToken({ template: "supabase" });
        if (!token) {
          // console.warn(`${debugPrefix} Missing supabase token`, { userId });
        }

        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            },
          },
        );

        // Try to get the user to check if they exist
        const { data: existingUser, error: fetchError } = await supabase
          .from("users")
          .select('id, "isDeleted"')
          .eq("clerk_user_id", userId)
          .maybeSingle();

        // If fetchError is not a "no rows" error, log and retry
        if (fetchError && fetchError.code !== "PGRST116") {
          // console.error(`${debugPrefix} Error checking user existence`, {
          //   code: fetchError.code,
          //   message: fetchError.message,
          //   details: (fetchError as any).details,
          //   hint: (fetchError as any).hint,
          // });
          if (retries > 0) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return syncUser(retries - 1);
          }
          return false;
        }

        // If user exists but is soft-deleted in our DB, block access.
        // This ensures deleted users cannot continue using the app even if they still have a stale session.
        if (existingUser && (existingUser as any).isDeleted === true) {
          console.warn("User is soft-deleted in DB; blocking sync:", userId);
          return false;
        }

        // If user doesn't exist (either fetchError is "no rows" or data is null), try to create
        let userIdInSupabase = existingUser?.id;
        if (!existingUser) {
          const { data: newUser, error: insertError } = await supabase
            .from("users")
            .insert({ clerk_user_id: userId })
            .select("id")
            .maybeSingle();

          if (insertError || !newUser) {
            // console.error(`${debugPrefix} Failed to create user in Supabase`, {
            //   code: insertError?.code,
            //   message: insertError?.message,
            //   details: (insertError as any)?.details,
            //   hint: (insertError as any)?.hint,
            // });
            if (retries > 0) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
              return syncUser(retries - 1);
            }
            return false;
          }
          userIdInSupabase = newUser.id;
        }

        if (!userIdInSupabase) {
          // console.error("User ID in Supabase is undefined after sync.");
          return false;
        }

        // Mark as synced for the session
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(storageKey, "1");
          }
        } catch {}

        // console.log("✅ User synced to Supabase successfully");
        return true;
      } catch (error) {
        // console.error("[syncUserToSupabase] Error in syncUser:", error);
        if (retries > 0) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return syncUser(retries - 1);
        }
        return false;
      }
    },
    [userId, user, getToken],
  );

  return { syncUser };
}
