// apps/admin/app/api/admin/sessions/route.ts
import { NextResponse } from "next/server";
import redis, {
  ensureRedisConnection,
  parseSessionValue,
} from "../../../../lib/redisAdmin";
import { requireAdmin } from "../../../../lib/adminAuth";
import * as Sentry from "@sentry/nextjs";

export async function GET(req: Request) {
  // verify admin
  try {
    const { adminId, email } = await requireAdmin();
    Sentry.setUser({
      id: adminId,
      email: email,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const redisClient = await ensureRedisConnection();

    // Test Redis connection
    try {
      await redisClient.ping();
      console.log("[GET /api/admin/sessions] Redis connection: OK");
    } catch (pingErr) {
      console.error("[GET /api/admin/sessions] Redis ping failed:", pingErr);
    }

    // Extract query parameters
    const { searchParams } = new URL(req.url);
    const useIndex = searchParams.get("useIndex") === "true";
    const startParam = searchParams.get("start");
    const limitParam = searchParams.get("limit");
    const cursorParam = searchParams.get("cursor");

    const start = startParam ? parseInt(startParam, 10) : 0;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;
    const scanCursor = cursorParam || "0";

    console.log("[GET /api/admin/sessions] Starting session fetch", {
      useIndex,
      start,
      cursor: scanCursor,
      limit,
    });

    const sessions: Array<{
      sessionKey: string;
      userId: string | null;
      createdAt: string | null;
      ttlSeconds: number | null;
      destination: string | null;
      budget: number | null;
    }> = [];
    let nextCursor: string | number | null = null;

    // Helper function to extract session data from parsed object
    function extractSessionData(key: string, parsed: unknown) {
      const parsedObj =
        parsed && typeof parsed === "object" && parsed !== null
          ? (parsed as Record<string, unknown>)
          : null;

      // Extract userId - check multiple possible locations
      const staticObj =
        parsedObj?.static && typeof parsedObj.static === "object"
          ? (parsedObj.static as Record<string, unknown>)
          : null;
      const staticAttrs =
        parsedObj?.static_attributes &&
        typeof parsedObj.static_attributes === "object"
          ? (parsedObj.static_attributes as Record<string, unknown>)
          : null;
      const userId =
        (staticObj?.clerkUserId && typeof staticObj.clerkUserId === "string"
          ? staticObj.clerkUserId
          : null) ??
        (staticAttrs?.clerkUserId && typeof staticAttrs.clerkUserId === "string"
          ? staticAttrs.clerkUserId
          : null) ??
        (parsedObj?.userId && typeof parsedObj.userId === "string"
          ? parsedObj.userId
          : null) ??
        null;

      // Extract destination - handle both object and string formats
      let destination: string | null = null;
      const travelObj =
        parsedObj?.travel && typeof parsedObj.travel === "object"
          ? (parsedObj.travel as Record<string, unknown>)
          : null;
      const destObj = travelObj?.destination ?? parsedObj?.destination;
      if (destObj) {
        if (typeof destObj === "string") {
          destination = destObj;
        } else if (destObj && typeof destObj === "object") {
          const dest = destObj as Record<string, unknown>;
          destination =
            dest?.name && typeof dest.name === "string" ? dest.name : null;
        }
      }

      // Extract budget
      const budget =
        (travelObj?.budget !== undefined ? travelObj.budget : null) ??
        (parsedObj?.budget !== undefined ? parsedObj.budget : null) ??
        null;
      const budgetNum = typeof budget === "number" ? budget : null;

      // Extract createdAt
      const createdAt =
        (parsedObj?.createdAt && typeof parsedObj.createdAt === "string"
          ? parsedObj.createdAt
          : null) ??
        (parsedObj?.created_at && typeof parsedObj.created_at === "string"
          ? parsedObj.created_at
          : null) ??
        null;

      return { userId, destination, budget: budgetNum, createdAt };
    }

    // Prefer index if requested
    if (useIndex) {
      try {
        // Try LRANGE (if index is a list)
        const end = start + limit - 1;
        const keys = await redis.lRange("sessions:index", start, end);
        if (Array.isArray(keys) && keys.length > 0) {
          for (const key of keys) {
            try {
              const raw = await redis.get(key);
              if (!raw) continue;

              const parsed = parseSessionValue(raw);
              const ttl = await redis.ttl(key);
              const { userId, destination, budget, createdAt } =
                extractSessionData(key, parsed);

              sessions.push({
                sessionKey: key,
                userId,
                createdAt,
                ttlSeconds: typeof ttl === "number" && ttl >= 0 ? ttl : null,
                destination,
                budget,
              });
            } catch (e) {
              console.error("Error reading session", key, e);
            }
          }
          nextCursor = start + keys.length;
        }
      } catch (err) {
        // index may not be present or be a different type; fallback to SCAN
        console.warn("sessions:index read failed, falling back to SCAN:", err);
      }
    }

    // Fallback to SCAN if index not used or failed
    if (!useIndex || sessions.length === 0) {
      const match = "session:*";
      const count = Math.max(50, limit * 3);
      const scanRes = await redis.scan(scanCursor, {
        MATCH: match,
        COUNT: count,
      });
      nextCursor = scanRes.cursor;
      const keys = scanRes.keys ?? [];

      for (let i = 0; i < keys.length && sessions.length < limit; i++) {
        const key = keys[i];
        try {
          const raw = await redis.get(key);
          if (!raw) continue;

          const parsed = parseSessionValue(raw);
          const ttl = await redis.ttl(key);
          const { userId, destination, budget, createdAt } = extractSessionData(
            key,
            parsed
          );

          sessions.push({
            sessionKey: key,
            userId,
            createdAt,
            ttlSeconds: typeof ttl === "number" && ttl >= 0 ? ttl : null,
            destination,
            budget,
          });
        } catch (e) {
          console.error("Error reading session", key, e);
        }
      }
    }

    console.log("[GET /api/admin/sessions] Returning sessions", {
      count: sessions.length,
      nextCursor,
      sampleSession: sessions[0] || null,
    });

    return NextResponse.json({ sessions, nextCursor }, { status: 200 });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        scope: "admin-api",
        route: "GET /api/admin/sessions",
      },
    });
    throw error;
  }
}
