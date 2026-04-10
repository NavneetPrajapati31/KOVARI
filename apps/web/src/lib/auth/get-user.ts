import { NextRequest } from "next/server";
import { resolveUser } from "./resolveUser";

export interface AuthenticatedUser {
  id: string; // Supabase UUID
  email: string;
  clerkUserId?: string;
  isMobile: boolean;
}

/**
 * Unified auth helper to resolve the current user from either Clerk or Mobile JWT.
 * Now refactored to use the hardened resolveUser utility.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const result = await resolveUser(req, { mode: 'optional' });

    if (!result.ok || !result.user) {
      return null;
    }

    return {
      id: result.user.userId,
      email: result.user.email,
      clerkUserId: result.user.provider === 'clerk' ? 'provided' : undefined, // Legacy compat: we don't need the actual clerk ID here for most callers
      isMobile: result.user.provider === 'jwt',
    };
  } catch (error) {
    console.error("Legacy auth helper error:", error);
    return null;
  }
}

