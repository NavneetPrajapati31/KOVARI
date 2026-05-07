import crypto from "crypto";

/**
 * PRODUCTION-GRADE INTERNAL HMAC AUTHENTICATION
 * Format: userId|timestamp|requestId
 */
export function getInternalAuthHeaders(userId: string, requestId: string): Record<string, string> {
  const secret = process.env.INTERNAL_API_SECRET_CURRENT;
  
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("CRITICAL: INTERNAL_API_SECRET_CURRENT is NOT defined in production.");
    }
    // Fallback for dev only
    console.warn("INTERNAL_API_SECRET_CURRENT is missing. Using insecure fallback for dev.");
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = `${userId}|${timestamp}|${requestId}`;
  
  const signature = crypto
    .createHmac("sha256", secret || "dev-secret")
    .update(payload)
    .digest("hex");

  return {
    "X-User-Id": userId,
    "X-Timestamp": timestamp,
    "X-Internal-Signature": signature,
    "X-Request-Id": requestId,
  };
}
