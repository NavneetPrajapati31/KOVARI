import { NextRequest } from "next/server";
import { resolveUser } from "./resolveUser";

/**
 * Unified helper to get the authenticated user ID from either Clerk (Web) 
 * or Mobile JWT. 
 * 
 * Now uses resolveUser to guarantee we return the internal UUID from 
 * the 'users' table. This eliminates 'PGRST116 0 rows' errors caused by 
 * mismatched clerk_user_ids in route handlers.
 */
export async function getAuthUserId(req: NextRequest): Promise<string | null> {
  try {
    const authResult = await resolveUser(req, { mode: 'optional' });
    if (authResult.ok && authResult.user) {
      // Return the internal UUID. 
      // Routes using this check `!userId.startsWith('user_')` and query by internal `id`.
      return authResult.user.userId;
    }
    return null;
  } catch (error) {
    console.error("[getAuthUserId] Failed to resolve user:", error);
    return null;
  }
}
