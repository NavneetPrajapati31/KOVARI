/**
 * 🏛️ Locked API Contract Types
 * Source of truth for all Kovari API responses.
 */

export enum ApiErrorCode {
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  PAYLOAD_TOO_LARGE = "PAYLOAD_TOO_LARGE",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export interface ApiError {
  message: string;
  code: ApiErrorCode;
  details?: any;
}

/**
 * Functional Metadata (Pagination, etc.)
 */
export interface ApiMeta {
  hasMore?: boolean;
  total?: number;
  page?: number;
  limit?: number;
  contractState?: 'clean' | 'filtered' | 'degraded';
  filtered?: boolean;
  droppedCount?: number;
  degraded?: boolean;
  [key: string]: any;
}

/**
 * Operational Context (Tracing, Latency)
 */
export interface ApiContext {
  requestId: string;
  timestamp: string;
  latencyMs?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  meta: ApiMeta;
  context: ApiContext;
  error: ApiError | null;
  // Duplicate for Phase 1 Mobile Compatibility
  hasMore?: boolean;
  requestId: string;
}

export type TransformResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError };

export interface Transformer<TInput, TOutput> {
  toStandard(input: TInput): TOutput;
}

export type KovariClient = "web" | "mobile" | "internal";
