// apps/admin/app/api/admin/sessions/expire/route.ts
import { NextResponse } from "next/server";
import redis, { ensureRedisConnection } from "../../../../../lib/redisAdmin";
import { requireAdmin } from "../../../../../lib/adminAuth";
import { logAdminAction } from "../../../../../lib/logAdminAction";

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
    return NextResponse.json({ error: "Invalid sessionKey format" }, { status: 400 });
  }
  
  if (confirm !== true) {
    return NextResponse.json({ error: "Operation requires confirm: true" }, { status: 400 });
  }

  // After all validations, we know rawSessionKey is definitely a string
  // Use type assertion to ensure TypeScript recognizes it as string
  const sessionKey = rawSessionKey as string;

  try {
    await ensureRedisConnection();

    const exists = (await redis.exists(sessionKey)) === 1;
    if (!exists) {
      await logAdminAction({
        admin_id: admin.adminId,
        target_type: "session",
        target_id: sessionKey,
        action: "expire_session_attempt_missing",
        reason: reason ?? null,
        metadata: { existed: false },
      }).catch(() => {});
      return NextResponse.json({ message: "Session not found or already expired" }, { status: 404 });
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

    await logAdminAction({
      admin_id: admin.adminId,
      target_type: "session",
      target_id: sessionKey,
      action: "expire_session",
      reason: reason ?? null,
      metadata: { deleted: delCount > 0 },
    }).catch((e) => {
      console.error("Failed to log admin action", e);
    });

    return NextResponse.json({ success: true, deleted: delCount > 0 }, { status: 200 });
  } catch (err) {
    console.error("Error expiring session", err);
    return NextResponse.json({ error: "Failed to expire session" }, { status: 500 });
  }
}
