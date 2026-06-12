import { NextRequest, NextResponse } from "next/server";
import { generateAccessToken, generateRefreshToken, hashToken } from "@/lib/auth/jwt";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";
import { generateRequestId } from "@/lib/api/requestId";
import { formatStandardResponse, formatErrorResponse } from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";
import { checkRateLimit } from "@/lib/auth/rateLimit";

function maskEmail(email: string): string {
  if (!email) return "";
  const parts = email.split("@");
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length <= 2) return `${local[0] || ""}*@${domain}`;
  return `${local.substring(0, 2)}${"*".repeat(local.length - 2)}@${domain}`;
}

/**
 * Handle OTP verification and final registration
 * POST /api/auth/verify-otp
 */
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = generateRequestId();

  const rateLimitResult = await checkRateLimit(request, 'login');
  if (!rateLimitResult.success) {
    const response = formatErrorResponse("Too many verification attempts", ApiErrorCode.RATE_LIMIT_EXCEEDED, requestId, 429);
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
    return response;
  }

  try {
    const { email, code } = await request.json();

    if (!email || !code) {
      return formatErrorResponse("Email and code are required", ApiErrorCode.BAD_REQUEST, requestId, 400);
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
      console.warn(`[AUTH] Failed verification attempt for ${maskEmail(email)} (No code found)`);
      return formatErrorResponse("Invalid or expired verification session", ApiErrorCode.BAD_REQUEST, requestId, 400);
    }

    // 3. Check for Expiry
    if (new Date() > new Date(verification.expires_at)) {
      return formatErrorResponse("Verification code has expired", ApiErrorCode.UNAUTHORIZED, requestId, 401);
    }

    // 4. Verify Code
    if (verification.code !== code) {
      await supabase
        .from("verification_codes")
        .update({ attempts: (verification.attempts || 0) + 1 })
        .eq("id", verification.id);

      return formatErrorResponse("Invalid verification code", ApiErrorCode.UNAUTHORIZED, requestId, 401);
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
      return formatErrorResponse("Failed to finalize account", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }

    // 6. Generate Tokens
    const refreshToken = generateRefreshToken(userId, email);
    const tokenHash = hashToken(refreshToken);
    const accessToken = generateAccessToken(userId, email, tokenHash);

    // 7. Store Refresh Token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: tokenError } = await supabase
      .from("refresh_tokens")
      .insert({
        user_id: userId,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

    if (tokenError) {
      console.error("Failed to store refresh token during verification:", tokenError);
      return formatErrorResponse("Auth session setup failed", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }

    // 8. Cleanup Verification Record
    await supabase.from("verification_codes").delete().eq("id", verification.id);

    const latencyMs = Date.now() - start;

    // 9. Return standard success envelope
    return formatStandardResponse(
      {
        accessToken,
        refreshToken,
        user: {
          id: userId,
          email,
          name: name,
        },
      },
      {},
      { requestId, latencyMs }
    );

  } catch (error) {
    console.error("Critical error in /api/auth/verify-otp:", error);
    return formatErrorResponse("Internal server error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}
