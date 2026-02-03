import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { ensureRedisConnection } from "@/lib/redis";
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
    const userId = await redis.get(redisKey);

    if (!userId) {
      return NextResponse.json(
        { error: "Reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    await client.users.updateUser(userId, { password: newPassword });

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
