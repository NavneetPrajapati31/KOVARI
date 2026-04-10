import { NextResponse } from "next/server";
import { 
  ApiResponse, 
  ApiMeta, 
  ApiContext,
  ApiError, 
  ApiErrorCode, 
  Transformer, 
  TransformResult 
} from "@/types/api";
import { logger } from "./logger";

/**
 * 🧱 Standard Response Assembler
 * Enforces v1 Contract and Tracing headers.
 */
export function formatStandardResponse<T>(
  data: T,
  meta: ApiMeta = {},
  context: { requestId: string; latencyMs: number },
  status = 200
): NextResponse {
  const apiContext: ApiContext = {
    requestId: context.requestId,
    latencyMs: context.latencyMs,
    timestamp: new Date().toISOString()
  };

  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: Object.freeze(meta),
    context: Object.freeze(apiContext),
    error: null,
    // Duplicate for legacy-backwards-compat (non-binding)
    requestId: context.requestId,
    hasMore: meta.hasMore
  };

  const nextResponse = NextResponse.json(response, { status });
  
  // Production Headers
  nextResponse.headers.set("X-Request-Id", context.requestId);
  nextResponse.headers.set("X-Kovari-Version", "v1");
  
  return nextResponse;
}

/**
 * 🛡️ Error Response Handler
 * Sanitizes internal failures and logs diagnostic codes.
 */
export function formatErrorResponse(
  message: string,
  code: ApiErrorCode,
  requestId: string,
  status = 500,
  details?: any
): NextResponse {
  const sanitizedMessage = status === 500 ? "Internal server error" : message;

  const error: ApiError = {
    message: sanitizedMessage,
    code,
    details
  };

  logger.error({
    requestId,
    route: "v1-standard",
    client: "shared",
    format: "standard",
    status,
    latencyMs: 0,
    error: { message, code, details }
  });

  const response: ApiResponse<null> = {
    success: false,
    data: null,
    meta: {},
    context: Object.freeze({
      requestId,
      timestamp: new Date().toISOString()
    }),
    error,
    requestId
  };

  const nextResponse = NextResponse.json(response, { status });
  nextResponse.headers.set("X-Request-Id", requestId);
  nextResponse.headers.set("X-Kovari-Version", "v1");

  return nextResponse;
}

/**
 * ⚡ DEPRECATED for internal routes. Use native NextResponse.json for legacy isolation.
 */
export function formatLegacyResponse(raw: any, status = 200): NextResponse {
  return NextResponse.json(raw, { status });
}

/**
 * 🛡️ Safe Transformation Execution
 */
export function safeTransform<TIn, TOut>(
  transformer: Transformer<TIn, TOut>,
  input: TIn
): TransformResult<TOut> {
  try {
    const data = transformer.toStandard(input);
    return { ok: true, data };
  } catch (err: any) {
    return { 
      ok: false, 
      error: { 
        message: err.message || "Transformation failed", 
        code: ApiErrorCode.INTERNAL_SERVER_ERROR 
      } 
    };
  }
}
