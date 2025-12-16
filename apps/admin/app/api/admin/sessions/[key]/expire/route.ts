import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { getRedisAdminClient } from "@/admin-lib/redisAdmin";
import { logAdminAction } from "@/admin-lib/logAdminAction";
import * as Sentry from "@sentry/nextjs";
import { incrementErrorCounter } from "@/admin-lib/incrementErrorCounter";

interface Params {
  params: Promise<{ key: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { adminId, email } = await requireAdmin();
    Sentry.setUser({
      id: adminId,
      email: email,
    });
    const { key } = await params;
    const sessionKey = decodeURIComponent(key); // key comes URL-encoded
    const body = await req.json().catch(() => ({}));
    const confirm = !!body.confirm;

    if (!confirm) {
      return NextResponse.json(
        { error: "Missing confirm=true in body for destructive action" },
        { status: 400 }
      );
    }

    const redis = getRedisAdminClient();

    // delete session itself
    await redis.del(sessionKey);

    // also remove from index if stored there
    await redis.sRem("sessions:index", sessionKey);

    await logAdminAction({
      adminId,
      targetType: "session",
      targetId: null,
      action: "EXPIRE_SESSION",
      reason: body.reason ?? null,
      metadata: { sessionKey },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    await incrementErrorCounter();
    Sentry.captureException(error, {
      tags: {
        scope: "admin-api",
        route: "POST /api/admin/sessions/[key]/expire",
      },
    });
    throw error;
  }
}
