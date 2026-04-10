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
import { validateGoMatchResponse } from "@/lib/api/validators/v1/matchValidator";
import { ApiErrorCode } from "@/types/api";

const supabase = createRouteHandlerSupabaseClientWithServiceRole();
const GO_URL = process.env.GO_SERVICE_URL || "http://localhost:8080";

/**
 * 🏛️ v1 GROUP MATCHING API (Hardened)
 */
export async function POST(req: NextRequest) {
  const start = Date.now();
  const requestId = generateRequestId();

  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);

    const body = await req.json();
    const { userId: reqUserId, ...payloadContext } = body;

    const email = authUser.email;
    const { data: dbUser } = await supabase.from("users").select("id").eq("email", email).single();
    if (!dbUser) return formatErrorResponse("User not found", ApiErrorCode.NOT_FOUND, requestId, 404);

    const goResponse = await fetchWithTimeout(`${GO_URL}/v1/match/group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: dbUser.id, context: payloadContext }),
      requestId,
    });

    const rawData = await safeParseJson(goResponse);
    
    // Rule #3: TRANSFORM ONLY VALIDATED DATA
    if (!validateGoMatchResponse(rawData)) {
      return formatErrorResponse("Service failure", ApiErrorCode.SERVICE_UNAVAILABLE, requestId, 503);
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const offset = (page - 1) * limit;

    const pagedData = Array.isArray(rawData) ? rawData.slice(offset, offset + limit) : [];
    const transformed = pagedData.map(g => {
      const result = safeTransform(matchTransformer, g);
      return result.ok ? result.data : null;
    }).filter(Boolean);

    const latencyMs = Date.now() - start;

    // Rule #4 & #7: RESTRUCTURED ENVELOPE { groups }
    return formatStandardResponse(
      { groups: transformed },
      { 
        hasMore: offset + limit < (Array.isArray(rawData) ? rawData.length : 0),
        total: Array.isArray(rawData) ? rawData.length : 0,
        page,
        limit 
      },
      { requestId, latencyMs }
    );

  } catch (err: any) {
    return formatErrorResponse("Internal critical error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}
