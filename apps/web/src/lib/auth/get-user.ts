import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getUserFromRequest } from "./middleware";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";

export interface AuthenticatedUser {
  id: string; // Supabase UUID
  clerkUserId?: string;
  isMobile: boolean;
}

/**
 * Unified auth helper to resolve the current user from either Clerk or Mobile JWT
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // 1. Try Mobile JWT first (Check for Authorization header)
    const mobileUser = await getUserFromRequest(req);
    if (mobileUser) {
      return {
        id: mobileUser.id,
        isMobile: true,
      };
    }

    // 2. Fallback to Clerk (Web)
    const { userId: clerkUserId } = await auth();
    if (clerkUserId) {
      const supabase = createRouteHandlerSupabaseClientWithServiceRole();
      
      // Attempt A: Match by clerk_user_id (Primary/Fast path)
      const { data: user, error } = await supabase
        .from("users")
        .select("id, clerk_user_id, email")
        .eq("clerk_user_id", clerkUserId)
        .maybeSingle();

      if (user && !error) {
        return {
          id: user.id,
          clerkUserId,
          isMobile: false,
        };
      }

      // Attempt B: Self-Healing Fallback (Match by email)
      // This handles cases where a mobile user logs into web for the first time
      // or the /api/users/sync call has not yet completed.
      console.log(`[AUTH] Clerk ID ${clerkUserId} not found in DB. Attempting email-based self-healing...`);
      
      try {
        const clerk = await clerkClient();
        const clerkUser = await clerk.users.getUser(clerkUserId);
        const email = clerkUser.primaryEmailAddress?.emailAddress || 
                      clerkUser.emailAddresses[0]?.emailAddress;

        if (email) {
          // Perform a case-insensitive search by email
          const { data: matchedUser, error: matchError } = await supabase
            .from("users")
            .select("id, clerk_user_id")
            .ilike("email", email) // Case-insensitive match
            .maybeSingle();

          if (matchedUser && !matchError) {
            console.log(`[AUTH] Self-healing match found for ${email}. Linking Clerk ID...`);
            
            // Link the clerk_user_id immediately to "heal" the identity
            await supabase
              .from("users")
              .update({ clerk_user_id: clerkUserId })
              .eq("id", matchedUser.id);

            return {
              id: matchedUser.id,
              clerkUserId,
              isMobile: false,
            };
          }
        }
      } catch (clerkErr) {
        console.error("[AUTH] Self-healing failed during Clerk fetch:", clerkErr);
      }
    }

    return null;
  } catch (error) {
    console.error("Unified auth helper error:", error);
    return null;
  }
}
