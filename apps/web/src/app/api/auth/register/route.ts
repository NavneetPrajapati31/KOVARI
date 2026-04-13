import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createRouteHandlerSupabaseClientWithServiceRole, sendRegistrationVerificationEmail } from "@kovari/api";
import { generateRequestId } from "@/lib/api/requestId";
import { formatStandardResponse, formatErrorResponse } from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";
import crypto from "crypto";

/**
 * Handle new user registration with Email/Verification OTP
 * POST /api/auth/register
 */
export async function POST(request: NextRequest) {
  const start = Date.now();
  const requestId = generateRequestId();

  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return formatErrorResponse("Email and password are required", ApiErrorCode.BAD_REQUEST, requestId, 400);
    }

    if (password.length < 8) {
      return formatErrorResponse("Password must be at least 8 characters long", ApiErrorCode.BAD_REQUEST, requestId, 400);
    }

    // 1. Initialize Supabase
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();

    // 2. Check for Cooldown and Active Lock
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingUser) {
      return formatErrorResponse("Email already in use", ApiErrorCode.CONFLICT, requestId, 409);
    }

    const { data: existingVerification } = await supabase
      .from("verification_codes")
      .select("last_sent_at, is_sending")
      .eq("email", email)
      .maybeSingle();

    if (existingVerification) {
      const lastSent = new Date(existingVerification.last_sent_at).getTime();
      const secondsSinceLast = (Date.now() - lastSent) / 1000;
      
      if (secondsSinceLast < 60) {
        return formatErrorResponse(
          `Please wait ${Math.ceil(60 - secondsSinceLast)}s before requesting a new code.`,
          ApiErrorCode.RATE_LIMIT_EXCEEDED,
          requestId,
          429
        );
      }

      if (existingVerification.is_sending) {
        return formatErrorResponse("A verification email is already being sent.", ApiErrorCode.RATE_LIMIT_EXCEEDED, requestId, 429);
      }
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 5. Atomic Reservation
    const { error: lockError } = await supabase
      .from("verification_codes")
      .upsert({
        email,
        code: otp,
        expires_at: expiresAt.toISOString(),
        payload: { passwordHash, name },
        is_sending: true,
        last_sent_at: new Date().toISOString(),
        attempts: 0,
      }, { onConflict: 'email' });

    if (lockError) {
      console.error("Failed to lock verification session:", lockError);
      return formatErrorResponse("Failed to initialize verification", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }

    // 6. Dispatch Email
    try {
      await sendRegistrationVerificationEmail({ to: email, code: otp });
    } catch (emailError) {
      console.error("Email dispatch failed during registration:", emailError);
      await supabase.from("verification_codes").update({ is_sending: false }).eq("email", email);
      return formatErrorResponse("Verification email service unavailable", ApiErrorCode.SERVICE_UNAVAILABLE, requestId, 503);
    }

    // 7. Cleanup & Return
    await supabase.from("verification_codes").update({ is_sending: false }).eq("email", email);
    const latencyMs = Date.now() - start;

    return formatStandardResponse(
      {
        verificationRequired: true,
        email,
        message: "Verification code sent. Please check your email."
      },
      {},
      { requestId, latencyMs }
    );

  } catch (error) {
    console.error("Critical error in /api/auth/register (OTP Flow):", error);
    return formatErrorResponse("Internal server error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}
