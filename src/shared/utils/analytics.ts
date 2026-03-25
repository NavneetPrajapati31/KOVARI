/**
 * Simple analytics tracking utility for KOVARI
 */
export async function trackEvent(
  eventName: string,
  eventData: Record<string, any> = {},
  sessionId?: string
) {
  try {
    // Fire and forget
    fetch("/api/analytics/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event_name: eventName,
        event_data: eventData,
        session_id: sessionId,
      }),
    }).catch((err) => console.error("Analytics error:", err));
  } catch (error) {
    // Silently fail in production
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to track event:", error);
    }
  }
}
