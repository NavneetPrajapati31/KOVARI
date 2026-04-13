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
import { groupTransformer } from "@/lib/transformers/groupTransformer";
import { validateGoMatchResponse, safeBatchValidate } from "@/lib/api/validators/v1/matchValidator";
import { GoGroupMatchSchema } from "@/lib/api/validators/v1/matchSchemas";
import { ApiErrorCode } from "@/types/api";
import { logger } from "@/lib/api/logger";
import { 
  getMatchingCache, 
  setMatchingCache, 
  generateMatchCacheKey,
  tryAcquireRefreshLock 
} from "@/lib/api/matching/cache";
import { matchingServiceBreaker } from "@/lib/api/matching/circuitBreaker";
import { performGroupDbMatchingFallback } from "@/lib/api/matching/fallback";

const GO_URL = process.env.GO_SERVICE_URL || "http://localhost:8080";

/**
 * 🏛️ HARDENED GROUP MATCHING API v2
 */
export async function POST(request: NextRequest) {
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

    // Force a fresh fetch to purge the empty cache caused by previous payload failures
    const userVersion = "v1-stable-groups-v4";

    const body = await request.json();
    const { userId: reqUserId, ...payloadContext } = body;
    const cacheKey = generateMatchCacheKey(userId, "group", payloadContext);

    // 1. Try Cache
    const cache = await getMatchingCache(cacheKey);
    if (cache && !cache.isExpired && cache.version === userVersion) {
      if (cache.isStale) {
        triggerBackgroundRefresh(userId, clerkId, userVersion, cacheKey, payloadContext);
      }
      return formatStandardResponse(
        { groups: cache.data },
        { source: "cache", degraded: false, hasMore: false },
        { requestId, latencyMs: Date.now() - start }
      );
    }

    // 2. Gather Candidates First (Go service acts as a scoring engine for groups)
    const rawCandidates = await performGroupDbMatchingFallback(userId, payloadContext);

    // 3. Try Go Service (ML Scoring)
    if (rawCandidates.length > 0 && await matchingServiceBreaker.shouldAllowRequest()) {
      try {
        const goPayload = {
          user: { userId: clerkId || userId }, // Provide bare minimum user session; Go will resolve static attributes
          candidates: rawCandidates.map((g: any) => ({
            groupId: g.id,
            name: g.name,
            description: g.description,
            destination: { name: g.destination },
            averageBudget: g.budget || g.averageBudget || 0,
            size: g.membersCount,
            privacy: g.is_public ? "public" : "private",
            creator: { 
              userId: g.creatorId,
              name: g.creator?.name || "Unknown",
              username: g.creator?.username || "unknown" 
            }
          })),
          configVersion: "DEFAULT"
        };

        const goResponse = await fetchWithTimeout(`${GO_URL}/v1/match/group`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "X-Request-Id": requestId
          },
          body: JSON.stringify(goPayload),
          timeout: 30000,
        });

        const rawData = await safeParseJson(goResponse);
        if (goResponse.ok && validateGoMatchResponse(rawData)) {
          const rawItems = Array.isArray(rawData) ? rawData : (rawData.groups || []);

          // PHASE 4: Hardened Validation & Adaptive Threshold
          const { validItems, droppedCount, state } = safeBatchValidate(rawItems, GoGroupMatchSchema, requestId);

          if (state !== 'degraded') {
            // HYDRATION PIPELINE: Merge the stripped Go ML response back onto the rich database candidates
            const hydratedData = validItems.map((goMatch: any) => {
              const parsedGroupId = goMatch.group?.groupId || goMatch.groupId || goMatch.id;
              const originalCandidate = rawCandidates.find((c: any) => c.id === parsedGroupId);
              
              if (!originalCandidate) return null; 
              
              return {
                ...originalCandidate, 
                score: goMatch.score ?? 0.5,
                breakdown: goMatch.breakdown ?? null
              };
            }).filter(Boolean);

            const transformed = transformGroups(hydratedData);
            await setMatchingCache(userId, cacheKey, transformed, userVersion);
            await matchingServiceBreaker.recordSuccess();

            return formatStandardResponse(
              { groups: transformed },
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
            logger.warn(requestId, "Go group response degraded below threshold - Returning unscored", { validCount: validItems.length });
          }
        }
        await matchingServiceBreaker.recordFailure();
      } catch (err) {
        await matchingServiceBreaker.recordFailure();
        logger.error(requestId, "Go Service Error (Group)", err);
      }
    }

    // 4. Fallback: Return Unscored Candidates
    return formatStandardResponse(
      { groups: rawCandidates },
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
async function triggerBackgroundRefresh(userId: string, clerkId: string | undefined, version: string, key: string, context: any) {
  if (!(await tryAcquireRefreshLock(key))) return;

  (async () => {
    try {
      const goResponse = await fetch(`${GO_URL}/v1/match/group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: clerkId || userId, context }),
      });

      const rawData = await goResponse.json();
      if (goResponse.ok && validateGoMatchResponse(rawData)) {
        await setMatchingCache(userId, key, transformGroups(rawData), version);
      }
    } catch (err) {
      logger.error("SWR-Background", "SWR Refresh Error (Group)", err);
    }
  })().catch(() => {});
}

function transformGroups(rawData: any[]) {
  return rawData.map((item: any) => {
    const res = safeTransform(groupTransformer, item);
    return res.ok ? res.data : null;
  }).filter(Boolean);
}
