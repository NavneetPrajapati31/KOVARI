import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { generateAccessToken, generateRefreshToken, hashToken } from "@/lib/auth/jwt";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";
import { generateRequestId } from "@/lib/api/requestId";
import { detectClient } from "@/lib/api/clientDetection";
import { 
  formatStandardResponse, 
  formatErrorResponse, 
  safeTransform 
} from "@/lib/api/responseHelpers";
import { userTransformer } from "@/lib/transformers/userTransformer";
import { ApiErrorCode, KovariClient } from "@/types/api";

/**
 * 🏛️ HARDENED LOGIN API (Phase 3 True Isolation)
 */
export async function POST(request: NextRequest) {
  const { client, error: clientError } = detectClient(request);

  // ⚡ TRUE LEGACY ISOLATION
  if (client === "web") {
    try {
      const { email, password } = await request.json();
      if (!email || !password) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

      const supabase = createRouteHandlerSupabaseClientWithServiceRole();
      const { data: user } = await supabase.from("users").select("*").ilike("email", email).maybeSingle();

      if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
      }

      const refreshToken = generateRefreshToken(user.id, user.email);
      const tokenHash = hashToken(refreshToken);
      const accessToken = generateAccessToken(user.id, user.email, tokenHash);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      await supabase.from("refresh_tokens").insert({
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
      });

      return NextResponse.json({
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name }
      });
    } catch (err: any) {
      return NextResponse.json({ error: "Auth failure" }, { status: 500 });
    }
  }

  // 🛡️ Standard Hardened Path
  const start = Date.now();
  const requestId = generateRequestId();

  if (clientError) {
    return formatErrorResponse(clientError, ApiErrorCode.BAD_REQUEST, requestId, 400);
  }

  return handleStandardLogin(request, requestId, start, client);
}

/**
 * Handle Standard Login (Mobile/v1)
 */
async function handleStandardLogin(
  request: NextRequest, 
  requestId: string, 
  start: number, 
  client: KovariClient
): Promise<NextResponse> {
  try {
    const { email, password } = await request.json();
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();
    const { data: user } = await supabase.from("users").select("*").ilike("email", email).maybeSingle();

    if (!user || !user.password_hash || !(await bcrypt.compare(password, user.password_hash))) {
      return formatErrorResponse("Invalid credentials", ApiErrorCode.UNAUTHORIZED, requestId, 401);
    }

    const refreshToken = generateRefreshToken(user.id, user.email);
    const tokenHash = hashToken(refreshToken);
    const accessToken = generateAccessToken(user.id, user.email, tokenHash);

    const authData = {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name }
    };

    // Gate 2: Post-Transform Validation
    const result = safeTransform(userTransformer, authData.user);
    if (!result.ok || !result.data.email) {
      return formatErrorResponse("Contract failure", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }

    const latencyMs = Date.now() - start;

    // Rule #6: Consistency data: { user }
    return formatStandardResponse(
      { ...authData, user: result.data },
      {},
      { requestId, latencyMs }
    );

  } catch (err: any) {
    return formatErrorResponse("Login failed", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}
