import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";
import { generateRequestId } from "@/lib/api/requestId";
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
import { getInternalAuthHeaders } from "@/lib/api/internalAuth";
import { matchingServiceBreaker } from "@/lib/api/matching/circuitBreaker";
import { performSoloDbMatchingFallback } from "@/lib/api/matching/fallback";
import { logger } from "@/lib/api/logger";

const supabase = createRouteHandlerSupabaseClientWithServiceRole();
const GO_URL = process.env.GO_SERVICE_URL || "http://localhost:8080";

/**
 * 🏛️ v1 SOLO MATCHING API (Hardened Production Gateway)
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = request.headers.get("X-Request-Id") || generateRequestId();

  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);

    const email = authUser.email;
    const { data: dbUser } = await supabase.from("users").select("id").eq("email", email).single();
    if (!dbUser) return formatErrorResponse("User not found", ApiErrorCode.NOT_FOUND, requestId, 404);

    const userId = dbUser.id;
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const allowed = await matchingServiceBreaker.shouldAllowRequest();
    
    if (allowed) {
      try {
        const authHeaders = getInternalAuthHeaders(userId, requestId);

        // 2. STRICT 3s TIMEOUT CALL
        const goResponse = await fetchWithTimeout(`${GO_URL}/v1/match/solo`, {
          method: "POST",
          headers: { 
            ...authHeaders,
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({}),
          requestId,
          timeout: 3000, 
        });

        const rawData = await safeParseJson(goResponse);

        if (goResponse.ok && rawData?.success) {
          await matchingServiceBreaker.recordSuccess();

          const rawItems = rawData.data?.matches || [];
          const { validItems, droppedCount, state } = safeBatchValidate(rawItems, GoSoloMatchSchema, requestId);

          if (state !== 'degraded') {
            const transformed = validItems.map(m => {
              const result = safeTransform(matchTransformer, m);
              return result.ok ? result.data : null;
            }).filter(Boolean);

            return formatStandardResponse(
              { matches: transformed },
              { 
                source: "go",
                contractState: state,
                filtered: droppedCount > 0,
                droppedCount
              },
              { requestId, latencyMs: Date.now() - start }
            );
          }
        } else {
          // Record failure for 5xx or circuit breaker logic
          if (!goResponse.ok || goResponse.status >= 500) {
            await matchingServiceBreaker.recordFailure();
          }
        }
      } catch (err: any) {
        // Record failure on timeout/network error
        await matchingServiceBreaker.recordFailure();
        logger.error(requestId, "Go service call failed - Falling back to DB", err);
      }
    }

    // 3. PRODUCTION FALLBACK (DB MATCHING)
    const fallbackResults = await performSoloDbMatchingFallback(userId, params);
    
    return formatStandardResponse(
      { matches: fallbackResults },
      { source: "db", degraded: true, hasMore: false },
      { requestId, latencyMs: Date.now() - start }
    );

  } catch (err: any) {
    return formatErrorResponse("Internal critical error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}
