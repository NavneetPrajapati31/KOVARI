import { NextRequest, NextResponse } from "next/server";
import { hashToken } from "@/lib/auth/jwt";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";

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

    // 2. Delete from DB (Invalidate)
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();
    const { error } = await supabase
      .from("refresh_tokens")
      .delete()
      .eq("token_hash", tokenHash);

    if (error) {
      console.error("Logout DB error:", error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Critical logout error:", error);
    // Always return 200/Success for logout to avoid blocking the client
    return NextResponse.json({ success: true });
  }
}
