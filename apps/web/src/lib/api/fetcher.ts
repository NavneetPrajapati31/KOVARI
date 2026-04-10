import { ApiErrorCode } from "@/types/api";

/**
 * Hardened Fetch Utility for external service communication.
 * Implements: Timeouts, Network Error Sanitization, Response Size Controls.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number; requestId?: string; maxPayloadSize?: number } = {}
): Promise<Response> {
  const { 
    timeout = 15000, 
    requestId, 
    maxPayloadSize = 5 * 1024 * 1024, // 5MB Default
    ...fetchOptions 
  } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  // Propagate Request ID to upstream services
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

    // Payload Size Check
    const contentLength = response.headers.get("Content-Length");
    if (contentLength && parseInt(contentLength, 10) > maxPayloadSize) {
      throw new Error(`PAYLOAD_TOO_LARGE: Response size from ${url} exceeds limit.`);
    }

    return response;
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === "AbortError") {
      throw new Error(`SERVICE_UNAVAILABLE: Upstream service ${url} timed out after ${timeout}ms.`);
    }
    throw err;
  }
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
