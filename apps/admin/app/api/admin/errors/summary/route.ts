// apps/admin/app/api/admin/errors/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/admin-lib/adminAuth";
import { getRedisAdminClient } from "@/admin-lib/redisAdmin";
import * as Sentry from "@sentry/nextjs";

export async function GET(_req: NextRequest) {
  try {
    const { adminId, email } = await requireAdmin();
    Sentry.setUser({
      id: adminId,
      email: email,
    });

    const redis = getRedisAdminClient();

    // Get error count from Redis (24h rolling window)
    let errors24h = 0;
    try {
      const count = await redis.get("metrics:errors:24h");
      errors24h = count ? parseInt(count, 10) : 0;
    } catch (e) {
      console.error("Failed to get error counter:", e);
    }

    return NextResponse.json({
      errors24h: errors24h,
    });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        scope: "admin-api",
        route: "GET /api/admin/errors/summary",
      },
    });
    throw error;
  }
}
