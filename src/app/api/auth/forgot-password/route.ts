import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { randomBytes } from "crypto";
import { ensureRedisConnection } from "@/lib/redis";
import { sendPasswordResetEmail } from "@/lib/brevo";
import * as Sentry from "@sentry/nextjs";

const RESET_TOKEN_TTL_SECONDS = 3600; // 1 hour
const REDIS_KEY_PREFIX = "password_reset:";

function getBaseUrl(req: NextRequest): string {
  const origin = req.headers.get("origin");
  if (origin) return origin;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim() : "";

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      emailAddress: [email],
      limit: 1,
    });

    if (!users?.length) {
      return NextResponse.json(
        { success: true, message: "If that email is registered, you will receive a reset link shortly." },
        { status: 200 }
      );
    }

    const userId = users[0].id;
    const token = randomBytes(32).toString("hex");
    const redisKey = `${REDIS_KEY_PREFIX}${token}`;

    const redis = await ensureRedisConnection();
    await redis.setEx(redisKey, RESET_TOKEN_TTL_SECONDS, userId);

    const baseUrl = getBaseUrl(req);
    const resetLink = `${baseUrl}/forgot-password?token=${token}`;

    const result = await sendPasswordResetEmail({
      to: email,
      resetLink,
    });

    if (!result.success) {
      await redis.del(redisKey);
      console.error("Brevo password reset email failed:", result.error);
      Sentry.captureMessage("Password reset email send failed", {
        level: "error",
        extra: { error: result.error },
      });
      return NextResponse.json(
        { error: "Failed to send reset email. Please try again later." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { success: true, message: "If that email is registered, you will receive a reset link shortly." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password API error:", error);
    Sentry.captureException(error, {
      tags: { endpoint: "/api/auth/forgot-password" },
    });
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
