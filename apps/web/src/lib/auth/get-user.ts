import { auth } from "@clerk/nextjs/server";
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
      
      const { data: user, error } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", clerkUserId)
        .maybeSingle();

      if (user && !error) {
        return {
          id: user.id,
          clerkUserId,
          isMobile: false,
        };
      }
    }

    return null;
  } catch (error) {
    console.error("Unified auth helper error:", error);
    return null;
  }
}
