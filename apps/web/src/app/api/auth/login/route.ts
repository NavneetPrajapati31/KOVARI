import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken, hashToken } from "@/lib/auth/jwt";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";

/**
 * Handle custom Email/Password login
 * POST /api/auth/login
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // 1. Initialize Supabase
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();

    // 2. Lookup user by email (Unified SOT)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, password_hash")
      .ilike("email", email) 
      .maybeSingle();

    if (userError || !user) {
      console.warn(`[AUTH] Failed login attempt for ${email} (User not found)`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 3. Verify Password
    if (!user.password_hash) {
      console.warn(`[AUTH] Failed login attempt for ${email} (No password set - potentially SSO user)`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      console.warn(`[AUTH] Failed login attempt for ${email} (Invalid password)`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 4. Generate Tokens
    const userId = user.id;
    const refreshToken = generateRefreshToken(userId);
    const tokenHash = hashToken(refreshToken);
    const accessToken = generateAccessToken(userId, tokenHash);

    // 5. Store Hashed Refresh Token in DB for rotation/revocation
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
      console.error("Failed to store refresh token:", tokenError);
      return NextResponse.json({ error: "Auth session setup failed" }, { status: 500 });
    }

    // 6. Return success
    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email: user.email,
        name: user.name,
      },
    });

  } catch (error) {
    console.error("Critical error in /api/auth/login:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
