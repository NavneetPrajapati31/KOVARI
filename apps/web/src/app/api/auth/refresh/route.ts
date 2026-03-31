import { NextRequest, NextResponse } from "next/server";
import { 
  verifyRefreshToken, 
  generateAccessToken, 
  generateRefreshToken, 
  hashToken 
} from "@/lib/auth/jwt";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: "Refresh token is required" }, 
        { status: 400 }
      );
    }

    // 1. Verify Token Signature
    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" }, 
        { status: 401 }
      );
    }

    // 2. Lookup Hashed Token in Database (Replay Attack Protection)
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();
    const tokenHash = hashToken(refreshToken);

    const { data: storedToken, error: lookupError } = await supabase
      .from("refresh_tokens")
      .select("id, user_id")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (lookupError || !storedToken) {
      // Re-use detection: if token is valid but not in DB, it might have been stolen or used.
      console.warn(`[AUTH] Potential refresh token reuse attack for user: ${payload.userId}`);
      return NextResponse.json(
        { error: "Invalid refresh token session" }, 
        { status: 401 }
      );
    }

    // 3. ROTATION: Delete the old token immediately
    await supabase
      .from("refresh_tokens")
      .delete()
      .eq("id", storedToken.id);

    // 4. Generate & Store new pair
    const newAccessToken = generateAccessToken(payload.userId);
    const newRefreshToken = generateRefreshToken(payload.userId);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    const { error: storeError } = await supabase
      .from("refresh_tokens")
      .insert({
        user_id: payload.userId,
        token_hash: hashToken(newRefreshToken),
        expires_at: expiresAt.toISOString(),
      });

    if (storeError) {
      console.error("Failed to store rotated refresh token:", storeError);
      return NextResponse.json({ error: "Failed to rotate session" }, { status: 500 });
    }

    console.log(`[AUTH] Session rotated for user: ${payload.userId}`);

    return NextResponse.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
