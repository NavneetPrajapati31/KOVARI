import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { getUserFromRequest } from "./middleware";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";

export interface AuthenticatedUser {
  id: string; // Supabase UUID
  email: string;
  clerkUserId?: string;
  isMobile: boolean;
}

/**
 * Unified auth helper to resolve the current user from either Clerk or Mobile JWT
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();

    // 1. Try Mobile JWT first (Check for Authorization header)
    const mobileUser = await getUserFromRequest(req);
    if (mobileUser) {
      // For mobile, fetch the real identity email from our users table
      const { data: user, error } = await supabase
        .from("users")
        .select("id, email")
        .eq("id", mobileUser.id)
        .maybeSingle();

      if (user && !error) {
        return {
          id: user.id,
          email: user.email,
          isMobile: true,
        };
      }
      return null; // Token represents a non-existent or deleted user
    }

    // 2. Fallback to Clerk (Web)
    try {
      const { userId: clerkUserId } = await auth();
      if (clerkUserId) {
        // Attempt A: Match by clerk_user_id (Primary/Fast path)
        const { data: user, error } = await supabase
          .from("users")
          .select("id, clerk_user_id, email")
          .eq("clerk_user_id", clerkUserId)
          .maybeSingle();

        if (user && !error) {
          return {
            id: user.id,
            email: user.email,
            clerkUserId,
            isMobile: false,
          };
        }

        // Attempt B: Self-Healing Fallback (Match by email)
        // ... (Wrap this too to prevent Clerk network errors from crashing)
        try {
          const clerk = await clerkClient();
          const clerkUser = await clerk.users.getUser(clerkUserId);
          const email = clerkUser.primaryEmailAddress?.emailAddress || 
                        clerkUser.emailAddresses[0]?.emailAddress;

          if (email) {
            // Perform a case-insensitive search by email
            const { data: matchedUser, error: matchError } = await supabase
              .from("users")
              .select("id, clerk_user_id, email")
              .ilike("email", email) 
              .maybeSingle();

            if (matchedUser && !matchError) {
              console.log(`[AUTH] Self-healing match found for ${email}. Linking Clerk ID...`);
              
              await supabase
                .from("users")
                .update({ clerk_user_id: clerkUserId })
                .eq("id", matchedUser.id);

              return {
                id: matchedUser.id,
                email: matchedUser.email,
                clerkUserId,
                isMobile: false,
              };
            }
          }
        } catch (clerkErr) {
          console.error("[AUTH] Clerk verification helper failed:", clerkErr);
        }
      }
    } catch (authErr) {
      //auth() might throw if session is fundamentally broken or tampered
      console.warn("[AUTH] Clerk auth() failed (possibly tampered session):", authErr);
      return null;
    }

    return null;
  } catch (error) {
    console.error("Unified auth helper error:", error);
    return null;
  }
}
