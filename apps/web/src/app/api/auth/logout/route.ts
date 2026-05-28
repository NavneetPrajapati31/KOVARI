import { NextRequest, NextResponse } from "next/server";
import { hashToken } from "@/lib/auth/jwt";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";
import { writeAuditLog } from "@/lib/audit/log";

/**
 * Invalidate a mobile session
 * POST /api/auth/logout
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { refreshToken } = body;

    if (!refreshToken) {
      return NextResponse.json({ success: true });
    }

    // 1. Hash the token to find the DB record
    const tokenHash = hashToken(refreshToken);

    // 2. Fetch the user_id before deleting
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();
    const { data: tokenRecord } = await supabase
      .from("refresh_tokens")
      .select("user_id")
      .eq("token_hash", tokenHash)
      .single();

    // 3. Delete from DB (Invalidate)
    const { error } = await supabase
      .from("refresh_tokens")
      .delete()
      .eq("token_hash", tokenHash);

    if (error) {
      console.error("Logout DB error:", error);
    }

    if (tokenRecord?.user_id) {
      const ip = req.headers.get("x-forwarded-for") || "unknown";
      const userAgent = req.headers.get("user-agent") || "unknown";
      await writeAuditLog({
        action: "AUTH_LOGOUT",
        actorId: tokenRecord.user_id,
        ipAddress: ip,
        userAgent: userAgent,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Critical logout error:", error);
    // Always return 200/Success for logout to avoid blocking the client
    return NextResponse.json({ success: true });
  }
}
