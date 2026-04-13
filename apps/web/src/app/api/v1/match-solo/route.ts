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

const supabase = createRouteHandlerSupabaseClientWithServiceRole();
const GO_URL = process.env.GO_SERVICE_URL || "http://localhost:8080";

/**
 * 🏛️ v1 SOLO MATCHING API (Hardened)
 */
export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = generateRequestId();

  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);

    const email = authUser.email;
    const { data: dbUser } = await supabase.from("users").select("id").eq("email", email).single();
    if (!dbUser) return formatErrorResponse("User not found", ApiErrorCode.NOT_FOUND, requestId, 404);

    const goResponse = await fetchWithTimeout(`${GO_URL}/v1/match/solo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: dbUser.id }),
      requestId,
    });

    const rawData = await safeParseJson(goResponse);
    
    // Rule #3: TRANSFORM ONLY VALIDATED DATA
    if (!validateGoMatchResponse(rawData)) {
      return formatErrorResponse("Service failure", ApiErrorCode.SERVICE_UNAVAILABLE, requestId, 503);
    }

    const rawItems = Array.isArray(rawData) ? rawData : (rawData.matches || []);
    const { validItems, droppedCount, state } = safeBatchValidate(rawItems, GoSoloMatchSchema, requestId);

    if (state === 'degraded') {
      return formatErrorResponse("Service quality below threshold", ApiErrorCode.SERVICE_UNAVAILABLE, requestId, 503);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const offset = (page - 1) * limit;

    const pagedData = validItems.slice(offset, offset + limit);
    const transformed = pagedData.map(m => {
      const result = safeTransform(matchTransformer, m);
      return result.ok ? result.data : null;
    }).filter(Boolean);

    const latencyMs = Date.now() - start;

    // Rule #4 & #7: RESTRUCTURED ENVELOPE { matches }
    return formatStandardResponse(
      { matches: transformed },
      { 
        hasMore: offset + limit < validItems.length,
        total: validItems.length,
        page,
        limit,
        contractState: state,
        filtered: droppedCount > 0,
        droppedCount
      },
      { requestId, latencyMs }
    );

  } catch (err: any) {
    return formatErrorResponse("Internal critical error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}
