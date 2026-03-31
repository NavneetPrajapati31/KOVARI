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

    // 3. Find user by email (Primary Identifier in users table)
    let { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, google_id, clerk_user_id")
      .eq("email", email)
      .maybeSingle();

    if (userError) {
      console.error("Database error finding user in users table:", userError);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    let userId: string | null = null;

    // 4. Fallback lookup: Check profiles table if not found in users
    if (!user) {
      console.log(`[AUTH] User ${email} not found in users table. Checking profiles fallback...`);
      const { data: profileUser, error: profileError } = await supabase
        .from("profiles")
        .select("user_id, email")
        .eq("email", email)
        .maybeSingle();

      if (profileError) {
        console.error("Database error finding user in profiles table:", profileError);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      if (profileUser) {
        console.log(`[AUTH] User ${email} found in profiles table (ID: ${profileUser.user_id}). Backfilling users.email...`);
        // Self-heal: Backfill users.email from profiles
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({ email: email })
          .eq("id", profileUser.user_id)
          .select("id, email, name, google_id, clerk_user_id")
          .single();

        if (updateError) {
          console.error("Critical: Failed to backfill users.email after profile match:", updateError);
          // Continue anyway if we have the ID, or fail? Let's treat this as a success but log the error.
        }
        user = updatedUser;
        userId = profileUser.user_id;
      }
    }

    if (user) {
      userId = user.id;
      // 5. Update Identity (Merge Google ID if link is missing or name is new)
      if (user.google_id !== googleId) {
        await supabase
          .from("users")
          .update({ 
            google_id: googleId, 
            name: user.name || name,
            // Backfill email at login if it's missing (Self-healing Task 4/7)
            ...(user.email ? {} : { email: email })
          })
          .eq("id", userId);
      }
    } else {
      // 6. Create new user (Tasks 6: Always check both-handled by logic above)
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

    if (!userId) {
      return NextResponse.json({ error: "User resolution failed" }, { status: 500 });
    }

    // 8. Ensure Profile exists and is synced (Prevent dummy emails)
    await supabase
      .from("profiles")
      .upsert({
        user_id: userId,
        email: email,
        name: user?.name || name,
      }, { onConflict: "user_id" });

    // 7. Generate Tokens
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
