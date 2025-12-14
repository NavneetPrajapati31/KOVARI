// apps/admin/lib/adminSessionsApi.ts
import "server-only";
import redis, { ensureRedisConnection, parseSessionValue } from "./redisAdmin";
import { logAdminAction } from "./logAdminAction";

type SessionSummary = {
  sessionKey: string;
  userId: string | null;
  createdAt: string | null;
  ttlSeconds: number | null;
  destination: string | null;
  budget: number | null;
  raw?: unknown | null; // optional parsed JSON payload
};

type ListSessionsResult = {
  sessions: SessionSummary[];
  nextCursor?: string | number | null;
};

/**
 * List sessions (prefer sessions:index if you maintain it, else SCAN)
 *
 * options:
 * - useIndex: boolean — if true, try to read from `sessions:index` (LIST or SET).
 * - start: number — start index (if using list)
 * - limit: number — how many sessions to return (defaults to 20)
 * - scanCursor: string — SCAN cursor (string) to continue scanning when not using index
 */
export async function listSessions(options?: {
  useIndex?: boolean;
  start?: number;
  limit?: number;
  scanCursor?: string;
}): Promise<ListSessionsResult> {
  const {
    useIndex = true,
    start = 0,
    limit = 20,
    scanCursor = "0",
  } = options || {};
  await ensureRedisConnection();

  // Try index path first
  if (useIndex) {
    try {
      // Try LRANGE (if index is a list)
      const end = start + limit - 1;
      const keys = await redis.lRange("sessions:index", start, end);
      if (Array.isArray(keys) && keys.length > 0) {
        // Fetch values in parallel (simpler and avoids double fetch)
        const values = await Promise.all(keys.map((k) => redis.get(k)));
        const sessions: SessionSummary[] = [];
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const parsed = parseSessionValue(values[i]);
          const ttl = await redis.ttl(key);

          // Type guard: ensure parsed is an object
          const parsedObj =
            parsed && typeof parsed === "object" && parsed !== null
              ? (parsed as Record<string, unknown>)
              : null;

          // Extract userId - check multiple possible locations
          const staticObj =
            parsedObj?.static && typeof parsedObj.static === "object"
              ? (parsedObj.static as Record<string, unknown>)
              : null;
          const userId =
            (staticObj?.clerkUserId && typeof staticObj.clerkUserId === "string"
              ? staticObj.clerkUserId
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

          sessions.push({
            sessionKey: key,
            userId,
            createdAt,
            ttlSeconds: typeof ttl === "number" && ttl >= 0 ? ttl : null,
            destination,
            budget: budgetNum,
            raw: parsed ?? null,
          });
        }
        return { sessions, nextCursor: start + keys.length };
      }
      // if index list is empty, fall through to SCAN
    } catch (err) {
      // index may not be present or be a different type; fallback to SCAN
      console.warn("sessions:index read failed, falling back to SCAN:", err);
    }
  }

  // Fallback: use SCAN with scanCursor
  // We will perform a single SCAN call and return up to `limit` sessions
  const match = "session:*";
  const count = Math.max(50, limit * 3);
  const scanRes = await redis.scan(scanCursor, { MATCH: match, COUNT: count });
  const nextCursor = scanRes.cursor;
  const keys = scanRes.keys ?? [];
  const sessions: SessionSummary[] = [];
  if (keys.length > 0) {
    const pipeline = redis.multi();
    keys.forEach((k: string) => pipeline.get(k));
    const exec = await pipeline.exec();
    // exec returns array of tuples [err, value]
    for (let i = 0; i < keys.length && sessions.length < limit; i++) {
      const key = keys[i];
      const result = exec[i];
      const raw = (result && Array.isArray(result) ? result[1] : null) as
        | string
        | null;
      const parsed = parseSessionValue(raw);
      const ttl = await redis.ttl(key);

      // Type guard: ensure parsed is an object
      const parsedObj =
        parsed && typeof parsed === "object" && parsed !== null
          ? (parsed as Record<string, unknown>)
          : null;

      // Extract userId - check multiple possible locations
      const staticObj =
        parsedObj?.static && typeof parsedObj.static === "object"
          ? (parsedObj.static as Record<string, unknown>)
          : null;
      const userId =
        (staticObj?.clerkUserId && typeof staticObj.clerkUserId === "string"
          ? staticObj.clerkUserId
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

      sessions.push({
        sessionKey: key,
        userId,
        createdAt,
        ttlSeconds: typeof ttl === "number" && ttl >= 0 ? ttl : null,
        destination,
        budget: budgetNum,
        raw: parsed ?? null,
      });
    }
  }
  return { sessions, nextCursor };
}

/**
 * Get a single session's summary (raw + TTL).
 * Returns null if the key is not present or not readable.
 */
export async function getSession(
  sessionKey: string
): Promise<SessionSummary | null> {
  if (!sessionKey || typeof sessionKey !== "string") return null;
  await ensureRedisConnection();
  const exists = await redis.exists(sessionKey);
  if (!exists) return null;
  const raw = await redis.get(sessionKey);
  const parsed = parseSessionValue(raw);
  const ttl = await redis.ttl(sessionKey);

  // Type guard: ensure parsed is an object
  const parsedObj =
    parsed && typeof parsed === "object" && parsed !== null
      ? (parsed as Record<string, unknown>)
      : null;

  // Extract userId - check multiple possible locations
  const staticObj =
    parsedObj?.static && typeof parsedObj.static === "object"
      ? (parsedObj.static as Record<string, unknown>)
      : null;
  const userId =
    (staticObj?.clerkUserId && typeof staticObj.clerkUserId === "string"
      ? staticObj.clerkUserId
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

  return {
    sessionKey,
    userId,
    createdAt,
    ttlSeconds: typeof ttl === "number" && ttl >= 0 ? ttl : null,
    destination,
    budget: budgetNum,
    raw: parsed ?? null,
  };
}

/**
 * Expire / delete a session safely.
 *
 * - adminInfo: pass { adminId, adminEmail? } (used for audit logging)
 * - reason: optional reason string
 * - removeFromIndex: if true, attempt to remove key from sessions:index (list or set)
 *
 * Returns { deleted: boolean, existed: boolean }
 *
 * IMPORTANT: route handlers should call requireAdmin() before calling this helper
 * (this function assumes the caller already validated admin permissions).
 */
export async function expireSession(params: {
  sessionKey: string;
  adminInfo: { adminId: string; adminEmail?: string | null };
  reason?: string | null;
  removeFromIndex?: boolean;
}): Promise<{ deleted: boolean; existed: boolean }> {
  const {
    sessionKey,
    adminInfo,
    reason = null,
    removeFromIndex = true,
  } = params;
  if (!sessionKey || typeof sessionKey !== "string") {
    throw new Error("Invalid sessionKey");
  }

  await ensureRedisConnection();

  const existed = (await redis.exists(sessionKey)) === 1;
  if (!existed) {
    // Log attempted expire of non-existing session
    await logAdminAction({
      adminId: adminInfo.adminId,
      targetType: "session",
      targetId: sessionKey,
      action: "EXPIRE_SESSION",
      reason,
      metadata: { existed: false },
    }).catch(() => {});
    return { deleted: false, existed: false };
  }

  // Delete the session
  const delCount = await redis.del(sessionKey);

  // Remove from index if requested (tolerant)
  if (removeFromIndex) {
    try {
      // attempt LREM then SREM (depending on index data structure)
      await redis.lRem("sessions:index", 0, sessionKey).catch(() => {});
      await redis.sRem("sessions:index", sessionKey).catch(() => {});
    } catch (err) {
      // ignore index maintenance errors
      console.warn("Failed to update sessions:index", err);
    }
  }

  // Log the admin action to Supabase via helper
  await logAdminAction({
    adminId: adminInfo.adminId,
    targetType: "session",
    targetId: sessionKey,
    action: "EXPIRE_SESSION",
    reason,
    metadata: { deleted: delCount > 0 },
  }).catch((err) => {
    // ensure logging errors don't break main flow
    console.error("logAdminAction error:", err);
  });

  return { deleted: delCount > 0, existed: true };
}
