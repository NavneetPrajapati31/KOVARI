import { NextRequest, NextResponse } from "next/server";
import { verifyGoogleToken } from "@/lib/auth/google";
import { generateAccessToken, generateRefreshToken, hashToken } from "@/lib/auth/jwt";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";

/**
 * Exchange Google ID Token for custom JWT
 * POST /api/auth/google
 */
export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    // 1. Verify Google Token
    const googlePayload = await verifyGoogleToken(idToken);
    if (!googlePayload) {
      return NextResponse.json({ error: "Invalid Google token" }, { status: 401 });
    }

    const { email, name, googleId } = googlePayload;

    // 2. Initialize Supabase
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();

    // 3. Consolidated Atomic Identity Sync (Case 18: No partial user creation)
    const { data: userId, error: syncError } = await supabase
      .rpc("sync_user_identity", {
        p_email: email,
        p_name: name,
        p_google_id: googleId,
        p_clerk_id: null,
        p_password_hash: null,
      });

    if (syncError || !userId) {
      console.error("Atomic identity sync failed:", syncError);
      return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
    }

    // 4. Generate Tokens
    const refreshToken = generateRefreshToken(userId);
    const tokenHash = hashToken(refreshToken);
    const accessToken = generateAccessToken(userId, tokenHash);

    // 5. Store Hashed Refresh Token in DB for rotation/revocation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Matches REFRESH_TOKEN_EXPIRY (7d)

    const { error: tokenError } = await supabase
      .from("refresh_tokens")
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Failed to store refresh token:", tokenError);
      return NextResponse.json({ error: "Auth session failed" }, { status: 500 });
    }

    // 6. Return success
    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        name: name,
      },
    });

  } catch (error) {
    console.error("Critical error in /api/auth/google:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
