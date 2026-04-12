import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
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
import { validateGoMatchResponse } from "@/lib/api/validators/v1/matchValidator";
import { ApiErrorCode, KovariClient } from "@/types/api";
import { logger } from "@/lib/api/logger";

const supabase = createRouteHandlerSupabaseClientWithServiceRole();
const GO_URL = process.env.GO_SERVICE_URL || "http://localhost:8080";

/**
 * 🏛️ HARDENED SOLO MATCHING API (Phase 3 True Isolation)
 */
export async function GET(request: NextRequest) {
  const { client, error: clientError } = detectClient(request);

  // ⚡ TRUE LEGACY ISOLATION (Rule #1: No shared pipeline utilities)
  if (client === "web") {
    try {
      const authUser = await getAuthenticatedUser(request);
      if (!authUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const email = authUser.email;
      const { data: dbUser } = await supabase.from("users").select("id").eq("email", email).single();
      if (!dbUser) return NextResponse.json({ error: "User not found" }, { status: 404 });

      // Raw fetch from GO service
      const goResponse = await fetch(`${GO_URL}/v1/match/solo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: authUser.clerkUserId || authUser.id }),
      });

      if (!goResponse.ok) {
        const errorText = await goResponse.text();
        return NextResponse.json({ message: errorText || "Matching service failed" }, { status: goResponse.status });
      }

      const rawMatches = await goResponse.json();
      
      // Zero-overhead legacy return (Exact raw parity)
      return NextResponse.json(rawMatches);
    } catch (err: any) {
      console.error("Legacy match-solo failure:", err);
      return NextResponse.json({ message: "Legacy path failure", error: err.message }, { status: 500 });
    }
  }

  // 🛡️ Standard Hardened Path
  const start = Date.now();
  const requestId = generateRequestId();

  if (clientError) {
    return formatErrorResponse(clientError, ApiErrorCode.BAD_REQUEST, requestId, 400);
  }

  return handleStandardMatchSolo(request, requestId, start, client);
}

/**
 * Handle Standard requests (Mobile/v1)
 */
async function handleStandardMatchSolo(
  request: NextRequest, 
  requestId: string, 
  start: number, 
  client: KovariClient
): Promise<NextResponse> {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);

    const email = authUser.email;
    const { data: dbUser } = await supabase.from("users").select("id").eq("email", email).single();
    
    const goResponse = await fetchWithTimeout(`${GO_URL}/v1/match/solo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: authUser.clerkUserId || authUser.id }),
      requestId,
    });

    const rawData = await safeParseJson(goResponse);
    
    // Gate 1: Upstream Validation
    if (!validateGoMatchResponse(rawData)) {
      return formatErrorResponse("Service Unavailable", ApiErrorCode.SERVICE_UNAVAILABLE, requestId, 503);
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const offset = (page - 1) * limit;

    const pagedData = Array.isArray(rawData) ? rawData.slice(offset, offset + limit) : [];
    
    // Gate 2: Post-Transform Validation
    const transformed = pagedData.map((item: any) => {
      const res = safeTransform(matchTransformer, item);
      if (!res.ok || !res.data.userId) return null; // Post-transform check
      return res.data;
    }).filter(Boolean);

    const latencyMs = Date.now() - start;

    // Rule #6: Consistency data: { matches }
    return formatStandardResponse(
      { matches: transformed },
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
