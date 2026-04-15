import { NextRequest, NextResponse } from "next/server";
import { resolveUser } from "@/lib/auth/resolveUser";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";
import { generateRequestId } from "@/lib/api/requestId";
import { detectClient } from "@/lib/api/clientDetection";
import { fetchWithTimeout, safeParseJson } from "@/lib/api/fetcher";
import { 
  formatStandardResponse, 
  formatErrorResponse, 
  safeTransform 
} from "@/lib/api/responseHelpers";
import { matchTransformer } from "@/lib/transformers/matchTransformer";
import { validateGoMatchResponse, safeBatchValidate } from "@/lib/api/validators/v1/matchValidator";
import { GoSoloMatchSchema } from "@/lib/api/validators/v1/matchSchemas";
import { ApiErrorCode } from "@/types/api";
import { logger } from "@/lib/api/logger";
import { 
  getMatchingCache, 
  setMatchingCache, 
  generateMatchCacheKey,
  tryAcquireRefreshLock 
} from "@/lib/api/matching/cache";
import { matchingServiceBreaker } from "@/lib/api/matching/circuitBreaker";
import { performSoloDbMatchingFallback } from "@/lib/api/matching/fallback";

const GO_URL = process.env.GO_SERVICE_URL || "http://localhost:8080";

/**
 * 🏛️ HARDENED SOLO MATCHING API v2
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = generateRequestId();
  const { client } = detectClient(request);

  try {
    const authResult = await resolveUser(request, { mode: 'protected' });
    if (!authResult.ok || !authResult.user) return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);

    const userId = authResult.user.userId;
    const clerkId = authResult.user.providerId;

    const supabase = createRouteHandlerSupabaseClientWithServiceRole();
    const { data: dbUser, error: fetchError } = await supabase.from("users").select("id, email").eq("id", userId).single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      logger.error(requestId, "Metadata lookup failed", fetchError);
    }

    // Force a fresh fetch by bumping the version string
    const userVersion = "v1-stable-v11";

    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());
    const cacheKey = generateMatchCacheKey(userId, "solo", params);

    // 1. Try Cache
    const cache = await getMatchingCache(cacheKey);
    if (cache && !cache.isExpired && cache.version === userVersion) {
      // SWR Trigger: If stale, refresh in background
      if (cache.isStale) {
        triggerBackgroundRefresh(userId, clerkId, userVersion, cacheKey, params);
      }
      return formatStandardResponse(
        { matches: await enrichMatchesWithFollowing(userId, cache.data) },
        { source: "cache", degraded: false, hasMore: false },
        { requestId, latencyMs: Date.now() - start }
      );
    }

    // 2. Try Go Service (with Circuit Breaker)
    if (await matchingServiceBreaker.shouldAllowRequest()) {
      try {
        const goResponse = await fetchWithTimeout(`${GO_URL}/v1/match/solo`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Request-Id": requestId
          },
          body: JSON.stringify({ userId: clerkId || userId, context: params }),
          timeout: 30000,
        });

        const rawData = await safeParseJson(goResponse);
        const goValid = validateGoMatchResponse(rawData);

        logger.debug(requestId, { 
          source: "Go Service Raw Response",
          ok: goResponse.ok, 
          valid: goValid,
          rawItemCount: (rawData?.matches || rawData)?.length || 0 
        });

        if (goResponse.ok && goValid) {

          const rawItems = Array.isArray(rawData) ? rawData : (rawData.matches || []);
          
          // PHASE 4: Hardened Validation & Adaptive Threshold
          const { validItems, droppedCount, state } = safeBatchValidate(rawItems, GoSoloMatchSchema, requestId);

          if (state !== 'degraded') {
            const transformed = transformMatches(validItems);
            await setMatchingCache(userId, cacheKey, transformed, userVersion);
            await matchingServiceBreaker.recordSuccess();

            return formatStandardResponse(
              { matches: await enrichMatchesWithFollowing(userId, transformed) },
              { 
                source: "go", 
                contractState: state,
                filtered: droppedCount > 0,
                droppedCount,
                degraded: false, 
                hasMore: false 
              },
              { requestId, latencyMs: Date.now() - start }
            );
          } else {
            logger.warn(requestId, "Go response degraded below threshold - Triggering DB Fallback", { validCount: validItems.length, totalCount: rawItems.length });
          }
        }
        await matchingServiceBreaker.recordFailure();
      } catch (err) {
        await matchingServiceBreaker.recordFailure();
        logger.error(requestId, "Go Service Error", err);
      }
    }

    // 3. Fallback to DB
    const fallbackResults = await performSoloDbMatchingFallback(userId, params);
    return formatStandardResponse(
      { matches: await enrichMatchesWithFollowing(userId, fallbackResults) },
      { source: "db", degraded: true, hasMore: false },
      { requestId, latencyMs: Date.now() - start }
    );

  } catch (err: any) {
    return formatErrorResponse("Internal failure", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}

/**
 * Detached background refresh for SWR
 */
async function triggerBackgroundRefresh(userId: string, clerkId: string | undefined, version: string, key: string, params: any) {
  if (!(await tryAcquireRefreshLock(key))) return;

  // Fire and forget
  (async () => {
    try {
      const goResponse = await fetch(`${GO_URL}/v1/match/solo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: clerkId || userId, context: params }),
      });

      const rawData = await goResponse.json();
      if (goResponse.ok && validateGoMatchResponse(rawData)) {
        await setMatchingCache(userId, key, transformMatches(rawData), version);
      }
    } catch (err) {
      logger.error("SWR-Background", "SWR Refresh Error", err);
    }
  })().catch(() => {});
}

async function enrichMatchesWithFollowing(userId: string, matches: any[]) {
  if (matches.length === 0) return [];
  const supabase = createRouteHandlerSupabaseClientWithServiceRole();
  const matchUserIds = matches.map(m => m.userId);
  const { data: followings } = await supabase
    .from("user_follows")
    .select("following_id")
    .eq("follower_id", userId)
    .in("following_id", matchUserIds);

  const followingSet = new Set((followings || []).map(f => f.following_id));
  return matches.map(m => ({
    ...m,
    isFollowing: followingSet.has(m.userId)
  }));
}

function transformMatches(rawData: any[]) {
  return rawData.map((item: any) => {
    const res = safeTransform(matchTransformer, item);
    return res.ok ? res.data : null;
  }).filter(Boolean);
}
