import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";

export interface UserContext {
  id: string;
}

/**
 * Extracts and verifies the JWT from the Authorization header for mobile requests
 */
export async function getUserFromRequest(req: NextRequest): Promise<UserContext | null> {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);

    if (!payload || !payload.sub) {
      return null;
    }

    // Case 11: Logout then reuse token -> Rejected
    // If the token was linked to a session, verify the session still exists.
    if (payload.tokenHash) {
      const { createRouteHandlerSupabaseClientWithServiceRole } = await import("@kovari/api");
      const supabase = createRouteHandlerSupabaseClientWithServiceRole();
      
      const { data: session, error } = await supabase
        .from("refresh_tokens")
        .select("id")
        .eq("token_hash", payload.tokenHash)
        .maybeSingle();

      if (error || !session) {
        console.warn(`[AUTH] Rejected access token for user ${payload.sub} (Session invalid/logged out)`);
        return null;
      }
    }

    return {
      id: payload.sub,
    };
  } catch (error) {
    console.error("Auth middleware error:", error);
    return null;
  }
}
