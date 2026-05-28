import * as Sentry from "@sentry/nextjs";

export type SecuritySeverity = "low" | "medium" | "high" | "critical";

export interface SecurityAlertParams {
  event: string;
  severity: SecuritySeverity;
  details: Record<string, any>;
  userId?: string;
  ipAddress?: string;
}

/**
 * Sends a security alert to the configured monitoring system (Sentry/Logs).
 */
export async function sendSecurityAlert(params: SecurityAlertParams) {
  const { event, severity, details, userId, ipAddress } = params;

  // 1. Local Logging
  const logPrefix = `[SECURITY_ALERT][${severity.toUpperCase()}] ${event}`;
  if (severity === "high" || severity === "critical") {
    console.error(logPrefix, JSON.stringify({ userId, ipAddress, details }));
  } else {
    console.warn(logPrefix, JSON.stringify({ userId, ipAddress, details }));
  }

  // 2. Sentry Integration
  const sentryLevel = 
    severity === "critical" ? "fatal" :
    severity === "high" ? "error" :
    severity === "medium" ? "warning" : "info";

  Sentry.captureMessage(event, {
    level: sentryLevel,
    tags: {
      type: "security_alert",
      event,
      severity,
    },
    extra: {
      details,
      userId,
      ipAddress,
    }
  });

  // Future expansion: Slack/Discord Webhooks or PagerDuty integrations could go here
}
