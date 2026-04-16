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
import { GoGroupMatchSchema } from "@/lib/api/validators/v1/matchSchemas";
import { ApiErrorCode } from "@/types/api";
import { getInternalAuthHeaders } from "@/lib/api/internalAuth";
import { matchingServiceBreaker } from "@/lib/api/matching/circuitBreaker";
import { performGroupDbMatchingFallback } from "@/lib/api/matching/fallback";
import { logger } from "@/lib/api/logger";

const supabase = createRouteHandlerSupabaseClientWithServiceRole();
const GO_URL = process.env.GO_SERVICE_URL || "http://localhost:8080";

/**
 * 🏛️ v1 GROUP MATCHING API (Hardened Production Gateway)
 */
export async function POST(req: NextRequest) {
  const start = Date.now();
  const requestId = generateRequestId();

  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);

    const body = await req.json();
    const { userId: _, ...payloadContext } = body; // Strip body userId

    const email = authUser.email;
    const { data: dbUser } = await supabase.from("users").select("id").eq("email", email).single();
    if (!dbUser) return formatErrorResponse("User not found", ApiErrorCode.NOT_FOUND, requestId, 404);

    const userId = dbUser.id;

    // 3. Try Go Service (ML Scoring)
    const isGoConfigured = !!process.env.GO_SERVICE_URL && !GO_URL.includes("localhost");
    const canUseGoService = isGoConfigured || process.env.NODE_ENV === "development";
    
    if (canUseGoService && await matchingServiceBreaker.shouldAllowRequest()) {
      try {
        const authHeaders = getInternalAuthHeaders(userId, requestId);

        // 2. STRICT 3s TIMEOUT CALL
        const goResponse = await fetchWithTimeout(`${GO_URL}/v1/match/group`, {
          method: "POST",
          headers: { 
            ...authHeaders,
            "Content-Type": "application/json" 
          },
          body: JSON.stringify(payloadContext),
          requestId,
          timeout: 3000,
        });

        const rawData = await safeParseJson(goResponse);

        if (goResponse.ok && rawData?.success) {
          await matchingServiceBreaker.recordSuccess();

          const rawItems = rawData.data?.groups || [];
          const { validItems, droppedCount, state } = safeBatchValidate(rawItems, GoGroupMatchSchema, requestId);

          if (state !== 'degraded') {
            const transformed = validItems.map(g => {
              const result = safeTransform(matchTransformer, g);
              return result.ok ? result.data : null;
            }).filter(Boolean);

            return formatStandardResponse(
              { groups: transformed },
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
          if (!goResponse.ok || goResponse.status >= 500) {
            await matchingServiceBreaker.recordFailure();
          }
        }
      } catch (err: any) {
        await matchingServiceBreaker.recordFailure();
        logger.error(requestId, "Go service call failed - Falling back to DB", err);
      }
    }

    // 3. PRODUCTION FALLBACK (DB MATCHING)
    const fallbackResults = await performGroupDbMatchingFallback(userId, payloadContext);
    
    return formatStandardResponse(
      { groups: fallbackResults },
      { source: "db", degraded: true, hasMore: false },
      { requestId, latencyMs: Date.now() - start }
    );

  } catch (err: any) {
    return formatErrorResponse("Internal critical error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}
