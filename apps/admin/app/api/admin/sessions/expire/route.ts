// apps/admin/app/api/admin/sessions/expire/route.ts
import { NextResponse } from "next/server";
import redis, { ensureRedisConnection } from "../../../../../lib/redisAdmin";
import { requireAdmin } from "../../../../../lib/adminAuth";
import { logAdminAction } from "../../../../../lib/logAdminAction";
import * as Sentry from "@sentry/nextjs";
import { incrementErrorCounter } from "../../../../../lib/incrementErrorCounter";

function isValidSessionKey(key: unknown): key is string {
  if (typeof key !== "string") return false;
  if (!key.startsWith("session:")) return false;
  if (/\s/.test(key)) return false;
  if (key.length > 200) return false;
  return true;
}

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAdmin();
    Sentry.setUser({
      id: admin.adminId,
      email: admin.email,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { sessionKey?: string; confirm?: boolean; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { sessionKey: rawSessionKey, confirm, reason } = body ?? {};

  // Validate sessionKey exists and is valid
  if (!rawSessionKey || typeof rawSessionKey !== "string") {
    return NextResponse.json({ error: "Invalid sessionKey" }, { status: 400 });
  }

  if (!isValidSessionKey(rawSessionKey)) {
    return NextResponse.json(
      { error: "Invalid sessionKey format" },
      { status: 400 }
    );
  }

  if (confirm !== true) {
    return NextResponse.json(
      { error: "Operation requires confirm: true" },
      { status: 400 }
    );
  }

  // At this point, rawSessionKey is validated as a string
  const sessionKey = rawSessionKey;

  try {
    await ensureRedisConnection();

    const exists = (await redis.exists(sessionKey)) === 1;
    if (!exists) {
      // Log attempt to expire non-existent session
      try {
        await logAdminAction({
          adminId: admin.adminId,
          targetType: "session",
          targetId: null, // target_id is UUID type, session keys are strings
          action: "EXPIRE_SESSION",
          reason: reason ?? null,
          metadata: {
            existed: false,
            sessionKey, // Store session key in metadata instead
          },
        });
      } catch (logErr) {
        console.error(
          "[expire] Failed to log admin action for missing session:",
          logErr
        );
        // Continue even if logging fails
      }
      return NextResponse.json(
        { message: "Session not found or already expired" },
        { status: 404 }
      );
    }

    const delCount = await redis.del(sessionKey);

    // Maintain sessions:index (attempt both list and set removals)
    try {
      // node-redis method names: lRem, sRem
      await redis.lRem("sessions:index", 0, sessionKey).catch(() => {});
      await redis.sRem("sessions:index", sessionKey).catch(() => {});
    } catch {
      // ignore index maintenance errors
    }

    // Log successful session expiration to Supabase admin_actions table
    try {
      await logAdminAction({
        adminId: admin.adminId,
        targetType: "session",
        targetId: null, // target_id is UUID type, session keys are strings
        action: "EXPIRE_SESSION",
        reason: reason ?? null,
        metadata: {
          deleted: delCount > 0,
          sessionKey, // Store session key in metadata instead
          timestamp: new Date().toISOString(),
        },
      });
      console.log(
        "[expire] Successfully logged admin action to Supabase for session:",
        sessionKey
      );
    } catch (logErr) {
      console.error("[expire] Failed to log admin action to Supabase:", logErr);
      // Continue even if logging fails - don't fail the request
    }

    return NextResponse.json(
      { success: true, deleted: delCount > 0 },
      { status: 200 }
    );
  } catch (error) {
    await incrementErrorCounter();
    Sentry.captureException(error, {
      tags: {
        scope: "admin-api",
        route: "POST /api/admin/sessions/expire",
      },
    });
    throw error;
  }
}
