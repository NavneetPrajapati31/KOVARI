import { NextRequest, NextResponse } from "next/server";
import { generateAccessToken, generateRefreshToken, hashToken } from "@/lib/auth/jwt";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";

/**
 * Handle OTP verification and final registration
 * POST /api/auth/verify-otp
 */
export async function POST(request: NextRequest) {
  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    // 1. Initialize Supabase
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();

    // 2. Fetch Verification Record
    const { data: verification, error: fetchError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (fetchError || !verification) {
      console.warn(`[AUTH] Failed verification attempt for ${email} (No code found)`);
      return NextResponse.json({ error: "Invalid or expired verification session" }, { status: 400 });
    }

    // 3. Check for Expiry
    if (new Date() > new Date(verification.expires_at)) {
      return NextResponse.json({ error: "Verification code has expired" }, { status: 401 });
    }

    // 4. Verify Code
    if (verification.code !== code) {
      // Increment attempt counter for security
      await supabase
        .from("verification_codes")
        .update({ attempts: (verification.attempts || 0) + 1 })
        .eq("id", verification.id);

      return NextResponse.json({ error: "Invalid verification code" }, { status: 401 });
    }

    // 5. Finalize Registration (Atomic Sync)
    const { passwordHash, name } = verification.payload;
    const { data: userId, error: syncError } = await supabase
      .rpc("sync_user_identity", {
        p_email: email,
        p_name: name || null,
        p_password_hash: passwordHash,
        p_google_id: null,
        p_clerk_id: null,
      });

    if (syncError || !userId) {
      console.error("Final registration sync failed:", syncError);
      return NextResponse.json({ error: "Failed to finalize account" }, { status: 500 });
    }

    // 6. Generate Tokens
    const refreshToken = generateRefreshToken(userId, email);
    const tokenHash = hashToken(refreshToken);
    const accessToken = generateAccessToken(userId, email, tokenHash);

    // 7. Store Refresh Token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7d

    const { error: tokenError } = await supabase
      .from("refresh_tokens")
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Failed to store refresh token during verification:", tokenError);
      return NextResponse.json({ error: "Auth session setup failed" }, { status: 500 });
    }

    // 8. Cleanup Verification Record
    await supabase.from("verification_codes").delete().eq("id", verification.id);

    // 9. Return success
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
    console.error("Critical error in /api/auth/verify-otp:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
