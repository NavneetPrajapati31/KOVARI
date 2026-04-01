import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import bcrypt from "bcryptjs";
import { ensureRedisConnection, createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";
import * as Sentry from "@sentry/nextjs";

const REDIS_KEY_PREFIX = "password_reset:";
const MIN_PASSWORD_LENGTH = 8;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!token) {
      return NextResponse.json(
        { error: "Reset link is invalid or expired." },
        { status: 400 }
      );
    }

    if (!newPassword || newPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const redis = await ensureRedisConnection();
    const redisKey = `${REDIS_KEY_PREFIX}${token}`;
    const storedData = await redis.get(redisKey);

    if (!storedData) {
      return NextResponse.json(
        { error: "Reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Handle both legacy (string) and new (JSON) data formats for robustness
    let userId: string;
    let email: string | null = null;

    try {
      const parsed = JSON.parse(storedData);
      userId = parsed.userId;
      email = parsed.email;
    } catch {
      userId = storedData;
    }

    const client = await clerkClient();
    
    // 1. Update Clerk Password
    await client.users.updateUser(userId, { password: newPassword });

    // 2. Synchronize with Supabase (KOVARI's primary email/password logic)
    if (email) {
      try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);
        const supabase = createRouteHandlerSupabaseClientWithServiceRole();

        const { error: syncError } = await supabase
          .from("users")
          .update({ password_hash: passwordHash })
          .ilike("email", email);

        if (syncError) {
          console.error("[SYNC] Failed to sync password hash to Supabase:", syncError);
          // We don't fail the whole request since Clerk is updated, but we log it
        }
      } catch (err) {
        console.error("[SYNC] Critical error during Supabase password sync:", err);
      }
    }

    await redis.del(redisKey);

    return NextResponse.json(
      { success: true, message: "Your password has been reset. You can sign in with your new password." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Reset password API error:", error);
    Sentry.captureException(error, {
      tags: { endpoint: "/api/auth/reset-password" },
    });
    return NextResponse.json(
      { error: "Failed to reset password. Please try again or request a new link." },
      { status: 500 }
    );
  }
}

