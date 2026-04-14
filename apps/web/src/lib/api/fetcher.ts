import { ApiErrorCode } from "@/types/api";

/**
 * Hardened Fetch Utility for external service communication.
 * Implements: Timeouts, Network Error Sanitization, Response Size Controls, and Strict Retries.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { 
    timeout?: number; 
    requestId?: string; 
    maxPayloadSize?: number;
    retry?: boolean;
  } = {}
): Promise<Response> {
  const { 
    timeout = 3000, // Hard 3s limit for matching
    requestId, 
    maxPayloadSize = 1 * 1024 * 1024, // 1MB Hard Limit
    retry = true,
    ...fetchOptions 
  } = options;

  let retries = retry ? 1 : 0;
  let lastError: any;

  while (retries >= 0) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const headers = new Headers(fetchOptions.headers || {});
    if (requestId) {
      headers.set("X-Request-Id", requestId);
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);

      // 1. FAST FAIL: Do NOT retry on 4xx or 5xx Logic errors (only network/timeouts)
      if (response.status >= 400 && response.status < 500) {
        return response; // Forward 401, 403, 429 directly
      }

      // Payload Size Check
      const contentLength = response.headers.get("Content-Length");
      if (contentLength && parseInt(contentLength, 10) > maxPayloadSize) {
        throw new Error(`PAYLOAD_TOO_LARGE: Response size from ${url} exceeds limit.`);
      }

      return response;
    } catch (err: any) {
      clearTimeout(timer);
      lastError = err;

      const isTimeout = err.name === "AbortError";
      const isNetworkError = err.message.includes("fetch failed") || !err.response;

      // Only retry on network/timeout, max once
      if (retries > 0 && (isTimeout || isNetworkError)) {
        retries--;
        await new Promise(resolve => setTimeout(resolve, 500)); // Short backoff
        continue;
      }

      if (isTimeout) {
        throw new Error(`SERVICE_UNAVAILABLE: Upstream service ${url} timed out after ${timeout}ms.`);
      }
      throw err;
    }
  }

  throw lastError;
}

/**
 * Helper to safely parse JSON from a response, handling parsing errors.
 */
export async function safeParseJson(response: Response): Promise<any> {
  try {
    const text = await response.text();
    if (!text) return null;
    return JSON.parse(text);
  } catch (err) {
    throw new Error("INTERNAL_SERVER_ERROR: Failed to parse upstream service JSON.");
  }
}
