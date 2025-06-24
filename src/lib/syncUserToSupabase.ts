"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useAuth, useUser } from "@clerk/nextjs";

// This assumes you already have a Supabase client setup in /lib/supabase.ts
export function useSyncUserToSupabase() {
  const { getToken, userId } = useAuth();
  const { user } = useUser();

  const syncUser = async (retries = 3): Promise<boolean> => {
    if (!userId || !user) {
      console.warn("Clerk user not found");
      return false;
    }

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

      // First, try to get the user to check if they exist
      const { data: existingUser, error: fetchError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", userId)
        .single();

      if (fetchError) {
        // Log the full error object for debugging
        console.error("Error checking user existence:", {
          error: fetchError,
          code: fetchError.code,
          message: fetchError.message,
          details: fetchError.details,
        });

        // Only retry if it's not a "no rows" error
        if (fetchError.code !== "PGRST116") {
          if (retries > 0) {
            console.log(`Retrying... ${retries} attempts left`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return syncUser(retries - 1);
          }
          return false;
        }
      }

      // If user doesn't exist, create them
      let userIdInSupabase = existingUser?.id;
      if (!existingUser) {
        const { data: newUser, error: insertError } = await supabase
          .from("users")
          .insert({ clerk_user_id: userId })
          .select("id")
          .single();

        if (insertError) {
          console.error("Failed to create user in Supabase:", insertError);
          if (retries > 0) {
            console.log(`Retrying... ${retries} attempts left`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            return syncUser(retries - 1);
          }
          return false;
        }
        userIdInSupabase = newUser?.id;
      }

      console.log("✅ User synced to Supabase successfully");
      return true;
    } catch (error) {
      console.error("Error in syncUser:", error);
      if (retries > 0) {
        console.log(`Retrying... ${retries} attempts left`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return syncUser(retries - 1);
      }
      return false;
    }
  };

  return { syncUser };
}
