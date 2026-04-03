import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import bcrypt from "bcryptjs";
import { 
  ensureRedisConnection, 
  createRouteHandlerSupabaseClientWithServiceRole,
  sendPasswordChangedAlert 
} from "@kovari/api";
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
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();
    
    // 1. Update Clerk Password (Only if it's a Clerk User)
    const isClerkUser = userId.startsWith("user_");
    if (isClerkUser) {
      await client.users.updateUser(userId, { password: newPassword });
      console.log(`[AUTH] Successfully updated Clerk password for user ${userId}`);
    } else {
      console.log(`[AUTH] Skipping Clerk update for mobile/custom user ${userId}`);
    }

    // 2. Industry Standard: Invalidate All Active Session Tokens (Global Log-out)
    try {
      // Find the Supabase UUID first for session cleanup
      const { data: suUser } = await supabase
        .from("users")
        .select("id")
        .ilike("email", email || "")
        .maybeSingle();

      if (suUser?.id) {
        const { error: revokeError } = await supabase
          .from("refresh_tokens")
          .delete()
          .eq("user_id", suUser.id);
        
        if (revokeError) {
          console.error("[SECURITY] Failed to revoke sessions during reset:", revokeError);
        } else {
          console.log(`[SECURITY] Successfully revoked all sessions for user ${suUser.id}`);
        }
      }
    } catch (err) {
      console.error("[SECURITY] Critical error during session revocation:", err);
    }

    // 3. Synchronize with Supabase Password Hash
    if (email) {
      try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        const { error: syncError } = await supabase
          .from("users")
          .update({ password_hash: passwordHash })
          .ilike("email", email);

        if (syncError) {
          console.error("[SYNC] Failed to sync password hash to Supabase:", syncError);
        }

        // 4. Send Security Alert Notification
        await sendPasswordChangedAlert({ to: email }).catch((e) => {
          console.error("[SECURITY] Failed to send password changed alert:", e);
        });

      } catch (err) {
        console.error("[SYNC] Critical error during Supabase password sync:", err);
      }
    }

    // 5. Explicit Cleanup
    await redis.del(redisKey);
    // Also clear backoff counters for this email to allow immediate new management if needed
    if (email) {
      await redis.del(`pwd_reset_backoff:email:${email}`);
      await redis.del(`pwd_reset_last:email:${email}`);
    }

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

