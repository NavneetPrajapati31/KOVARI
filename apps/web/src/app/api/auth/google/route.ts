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

    // 3. Find user by email (Primary Identifier)
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, google_id, clerk_user_id")
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      console.error("Database error finding user:", userError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    let userId: string;

    if (user) {
      userId = user.id;
      // 4. Update Identity (Merge Google ID if link is missing)
      if (user.google_id !== googleId) {
        await supabase
          .from("users")
          .update({ 
            google_id: googleId, 
            name: user.name || name,
          })
          .eq("id", userId);
      }
    } else {
      // 5. Create new user
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          email,
          name,
          google_id: googleId,
        })
        .select("id")
        .single();

      if (createError || !newUser) {
        console.error("Failed to create unified user:", createError);
        return NextResponse.json({ error: "User creation failed" }, { status: 500 });
      }
      userId = newUser.id;
    }

    // 6. Generate Tokens
    const accessToken = generateAccessToken(userId);
    const refreshToken = generateRefreshToken(userId);

    // 7. Store Hashed Refresh Token in DB for rotation/revocation
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Matches REFRESH_TOKEN_EXPIRY (7d)

    const { error: tokenError } = await supabase
      .from("refresh_tokens")
      .insert({
        user_id: userId,
        token_hash: hashToken(refreshToken),
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Failed to store refresh token:", tokenError);
      return NextResponse.json({ error: "Auth session failed" }, { status: 500 });
    }

    // 8. Return success
    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        name: user?.name || name,
      },
    });

  } catch (error) {
    console.error("Critical error in /api/auth/google:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
