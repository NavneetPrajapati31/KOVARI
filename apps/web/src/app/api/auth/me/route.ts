import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth/middleware";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";

/**
 * Get current user context (Mobile JWT)
 * GET /api/auth/me
 */
export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate with JWT
    const userContext = await getUserFromRequest(request);
    if (!userContext) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = userContext;

    // 2. Query Supabase
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, name, google_id, clerk_user_id, banned, ban_reason, ban_expires_at")
      .eq("id", id)
      .maybeSingle();

    if (error || !user) {
      console.warn("User not found from valid JWT context:", id, error);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 3. Handle Ban Expiration
    let isActuallyBanned = user.banned ?? false;
    if (isActuallyBanned && user.ban_expires_at) {
      if (new Date(user.ban_expires_at) < new Date()) {
        isActuallyBanned = false;
        
        // Auto-lift ban in background (best effort)
        supabase.from("users").update({ banned: false }).eq("id", id).then(({ error }) => {
          if (error) console.error("Failed to auto-lift expired ban for user:", id, error);
        });
      }
    }

    // 4. Return user data
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        banned: isActuallyBanned,
        banReason: user.ban_reason || null,
        banExpiresAt: user.ban_expires_at || null,
      },
    });

  } catch (error) {
    console.error("Auth me error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
