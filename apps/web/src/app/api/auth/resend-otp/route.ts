import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClientWithServiceRole, sendRegistrationVerificationEmail } from "@kovari/api";
import crypto from "crypto";

/**
 * Handle OTP resending
 * POST /api/auth/resend-otp
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Initialize Supabase
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();

    // 2. Fetch Existing Verification Record (Ensure session is active)
    const { data: verification, error: fetchError } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (fetchError || !verification) {
      console.warn(`[AUTH] Failed resend request for ${email} (No pending session)`);
      return NextResponse.json({ error: "No active verification session found. Please register again." }, { status: 400 });
    }

    // 3. Industry Standard: 60s Cooldown
    const lastSent = new Date(verification.last_sent_at).getTime();
    const secondsSinceLast = (Date.now() - lastSent) / 1000;
    
    if (secondsSinceLast < 60) {
      return NextResponse.json(
        { error: `Please wait ${Math.ceil(60 - secondsSinceLast)}s before requesting a new code.` },
        { status: 429 }
      );
    }

    // 4. Race Condition Guard: If another process is currently sending, block this one
    if (verification.is_sending) {
      return NextResponse.json({ error: "A verification email is already being sent." }, { status: 429 });
    }

    // 5. Generate New 6-digit OTP
    const newOtp = crypto.randomInt(100000, 999999).toString();
    const newExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // 6. Atomic Reservation: Mark as "is_sending" before dispatch (Single Dispatch Guarantee)
    const { error: lockError } = await supabase
      .from("verification_codes")
      .update({
        code: newOtp,
        expires_at: newExpiresAt.toISOString(),
        is_sending: true,
        last_sent_at: new Date().toISOString(),
        resend_count: (verification.resend_count || 0) + 1,
        attempts: 0, // Reset attempt limit for new code
      })
      .eq("id", verification.id);

    if (lockError) {
      console.error("Failed to lock verification session durante resend:", lockError);
      return NextResponse.json({ error: "Failed to rotate verification code" }, { status: 500 });
    }

    // 7. Dispatch Email via Brevo (Enhanced with internal retries)
    try {
      await sendRegistrationVerificationEmail({ to: email, code: newOtp });
    } catch (emailError) {
      console.error("Email dispatch failed during resend:", emailError);
      // Ensure we unlock the record so the user can try again after cooldown
      await supabase.from("verification_codes").update({ is_sending: false }).eq("email", email);
      return NextResponse.json({ error: "Verification email service unavailable" }, { status: 503 });
    }

    // 8. Cleanup: Unlock after successful dispatch
    await supabase.from("verification_codes").update({ is_sending: false }).eq("email", email);

    // 6. Return success
    return NextResponse.json({
      success: true,
      message: "New verification code sent. Please check your email."
    });

  } catch (error) {
    console.error("Critical error in /api/auth/resend-otp:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
