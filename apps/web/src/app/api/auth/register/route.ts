import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createRouteHandlerSupabaseClientWithServiceRole, sendRegistrationVerificationEmail } from "@kovari/api";
import crypto from "crypto";

/**
 * Handle new user registration with Email/Verification OTP
 * POST /api/auth/register
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    // 1. Initialize Supabase
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();

    // 2. Check for Cooldown and Active Lock
    // Using a refined select to check both existing user and pending verification
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .ilike("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const { data: existingVerification } = await supabase
      .from("verification_codes")
      .select("last_sent_at, is_sending")
      .eq("email", email)
      .maybeSingle();

    // Industry Standard: 60s Cooldown
    if (existingVerification) {
      const lastSent = new Date(existingVerification.last_sent_at).getTime();
      const secondsSinceLast = (Date.now() - lastSent) / 1000;
      
      if (secondsSinceLast < 60) {
        return NextResponse.json(
          { error: `Please wait ${Math.ceil(60 - secondsSinceLast)}s before requesting a new code.` },
          { status: 429 }
        );
      }

      // Race Condition Guard: If another process is currently sending, block this one
      if (existingVerification.is_sending) {
        return NextResponse.json({ error: "A verification email is already being sent." }, { status: 429 });
      }
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 5. Atomic Reservation: Mark as "is_sending" before dispatch (Single Dispatch Guarantee)
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
      return NextResponse.json({ error: "Failed to initialize verification" }, { status: 500 });
    }

    // 6. Dispatch Email via Brevo (Enhanced with internal retries)
    try {
      await sendRegistrationVerificationEmail({ to: email, code: otp });
    } catch (emailError) {
      console.error("Email dispatch failed during registration:", emailError);
      // Ensure we unlock the record so the user can try again after cooldown
      await supabase.from("verification_codes").update({ is_sending: false }).eq("email", email);
      return NextResponse.json({ error: "Verification email service unavailable" }, { status: 503 });
    }

    // 7. Cleanup: Unlock after successful dispatch
    await supabase.from("verification_codes").update({ is_sending: false }).eq("email", email);

    // 7. Return Verification Required
    return NextResponse.json({
      verificationRequired: true,
      email,
      message: "Verification code sent. Please check your email."
    });

  } catch (error) {
    console.error("Critical error in /api/auth/register (OTP Flow):", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
