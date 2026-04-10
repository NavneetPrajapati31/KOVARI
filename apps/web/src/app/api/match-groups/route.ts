import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
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
import { validateGoMatchResponse } from "@/lib/api/validators/v1/matchValidator";
import { ApiErrorCode, KovariClient } from "@/types/api";
import { logger } from "@/lib/api/logger";

const supabase = createRouteHandlerSupabaseClientWithServiceRole();
const GO_URL = process.env.GO_SERVICE_URL || "http://localhost:8080";

/**
 * 🏛️ HARDENED GROUP MATCHING API (Phase 3 True Isolation)
 */
export async function POST(req: NextRequest) {
  const { client, error: clientError } = detectClient(req);

  // ⚡ TRUE LEGACY ISOLATION
  if (client === "web") {
    try {
      const authResult = await resolveUser(req, { mode: 'protected' });
      if (!authResult.ok || !authResult.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const body = await req.json();
      const { userId: reqUserId, ...payloadContext } = body;

      const userId = authResult.user.userId;

      const goResponse = await fetch(`${GO_URL}/v1/match/group`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, context: payloadContext }),
      });

      const rawGroups = await goResponse.json();
      
      // Legacy Parity: Return the grouped object expected by web
      const totalGroups = Array.isArray(rawGroups) ? rawGroups.length : 0;
      return NextResponse.json({ 
        groups: rawGroups, 
        isMLUsed: true, 
        meta: { totalSearched: totalGroups } 
      });
    } catch (err: any) {
      return NextResponse.json({ error: "Legacy path failure" }, { status: 500 });
    }
  }

  // 🛡️ Standard Hardened Path
  const start = Date.now();
  const requestId = generateRequestId();

  if (clientError) {
    return formatErrorResponse(clientError, ApiErrorCode.BAD_REQUEST, requestId, 400);
  }

  return handleStandardMatchGroup(req, requestId, start, client);
}

/**
 * Handle Standard Match Group (Mobile/v1)
 */
async function handleStandardMatchGroup(
  req: NextRequest, 
  requestId: string, 
  start: number, 
  client: KovariClient
): Promise<NextResponse> {
  try {
    const authResult = await resolveUser(req, { mode: 'protected' });
    if (!authResult.ok || !authResult.user) return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);

    const body = await req.json();
    const { userId: reqUserId, ...payloadContext } = body;
    const userId = authResult.user.userId;

    const goResponse = await fetchWithTimeout(`${GO_URL}/v1/match/group`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, context: payloadContext }),
      requestId,
    });

    const rawData = await safeParseJson(goResponse);

    // Gate 1: Upstream Validation
    if (!validateGoMatchResponse(rawData)) {
      return formatErrorResponse("Service Unavailable", ApiErrorCode.SERVICE_UNAVAILABLE, requestId, 503);
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const offset = (page - 1) * limit;

    const pagedData = Array.isArray(rawData) ? rawData.slice(offset, offset + limit) : [];
    
    // Gate 2: Post-Transform Validation
    const transformed = pagedData.map((item: any) => {
      const res = safeTransform(groupTransformer, item);
      if (!res.ok || !res.data.id) return null; // Correctly check for Group ID
      return res.data;
    }).filter(Boolean);

    const latencyMs = Date.now() - start;

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
    return formatErrorResponse("Internal failure", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}
