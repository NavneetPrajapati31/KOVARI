import "server-only";
import * as Sentry from "@sentry/nextjs";
import { passwordResetEmail } from "./email-templates/password-reset";
import { groupInviteEmail } from "./email-templates/group-invite";

const SENDER_EMAIL = process.env.BREVO_FROM_EMAIL || "noreply@kovari.com";
const SENDER_NAME = process.env.BREVO_FROM_NAME || "KOVARI";

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [2000, 4000, 8000];

interface BrevoEmailParams {
  to: Array<{ email: string }>;
  sender: { email: string; name: string };
  subject: string;
  htmlContent: string;
}

/** Shared Brevo send with retries + extended timeout for reliable delivery */
async function sendBrevoWithRetry(
  params: BrevoEmailParams
): Promise<{ messageId?: string } | { error: string }> {
  const SibApiV3Sdk = await import("sib-api-v3-sdk");
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];
  apiKey.apiKey = process.env.BREVO_API_KEY!;
  defaultClient.timeout = 90000;

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  sendSmtpEmail.to = params.to;
  sendSmtpEmail.sender = params.sender;
  sendSmtpEmail.subject = params.subject;
  sendSmtpEmail.htmlContent = params.htmlContent;

  const isRetriable = (err: unknown) => {
    const e = err as { message?: string; code?: string; response?: { status?: number } };
    return (
      e?.message?.includes("Timeout") ||
      e?.code === "ECONNRESET" ||
      e?.code === "ETIMEDOUT" ||
      e?.code === "ENOTFOUND" ||
      (e?.response?.status != null && e.response.status >= 500)
    );
  };

  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
      return { messageId: data.messageId };
    } catch (err) {
      lastError = err;
      if (attempt < MAX_RETRIES - 1 && isRetriable(err)) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      } else {
        break;
      }
    }
  }

  const err = lastError as { response?: { body?: { message?: string } }; message?: string };
  const errorMessage =
    err?.response?.body?.message || err?.message || "Unknown error sending email";
  return { error: errorMessage };
}

export interface SendPasswordResetEmailParams {
  to: string;
  resetLink: string;
}

/**
 * Sends a password reset email via Brevo (sib-api-v3-sdk).
 * Uses dynamic import to avoid client bundling issues, matching waitlist implementation.
 */
export const sendPasswordResetEmail = async ({
  to,
  resetLink,
}: SendPasswordResetEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  if (!process.env.BREVO_API_KEY) {
    return { success: false, error: "BREVO_API_KEY is not configured" };
  }

  return Sentry.startSpan(
    {
      op: "email.send",
      name: "Send Password Reset Email",
    },
    async (span) => {
      span.setAttribute("recipient", to);
      span.setAttribute("sender", SENDER_EMAIL);

      const subject = "Reset your KOVARI password";
      const html = passwordResetEmail({ resetLink });

      const sendSmtpEmail = {
        to: [{ email: to }],
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        subject,
        htmlContent: html,
      };

      const result = await sendBrevoWithRetry(sendSmtpEmail);

      if ("messageId" in result) {
        const messageId = result.messageId || "unknown";
        span.setAttribute("success", true);
        span.setAttribute("message_id", messageId);
        console.log("Password reset email sent successfully:", { to, messageId });
        return { success: true, messageId };
      }

      const errorMsg = "error" in result ? result.error : "Unknown error";
      Sentry.captureMessage("Password reset email send failed", {
        level: "error",
        extra: { error: errorMsg, recipient: to },
      });
      span.setAttribute("error", true);
      span.setAttribute("error_message", errorMsg);
      console.error("Error sending password reset email:", { to, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  );
};

export interface SendGroupInviteEmailParams {
  to: string;
  groupName: string;
  inviteLink: string;
  senderName?: string;
}

/**
 * Sends a group invitation email via Brevo (formatted HTML).
 */
export const sendGroupInviteEmail = async ({
  to,
  groupName,
  inviteLink,
  senderName = "Someone",
}: SendGroupInviteEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  if (!process.env.BREVO_API_KEY) {
    return { success: false, error: "BREVO_API_KEY is not configured" };
  }

  return Sentry.startSpan(
    {
      op: "email.send",
      name: "Send Group Invite Email",
    },
    async (span) => {
      span.setAttribute("recipient", to);
      span.setAttribute("sender", SENDER_EMAIL);

      const subject = `You're invited to join ${groupName} on KOVARI`;
      const html = groupInviteEmail({
        groupName,
        inviteLink,
        senderName,
      });

      const sendSmtpEmail = {
        to: [{ email: to }],
        sender: { email: SENDER_EMAIL, name: SENDER_NAME },
        subject,
        htmlContent: html,
      };

      const result = await sendBrevoWithRetry(sendSmtpEmail);

      if ("messageId" in result) {
        const messageId = result.messageId || "unknown";
        span.setAttribute("success", true);
        span.setAttribute("message_id", messageId);
        console.log("Group invite email sent successfully:", {
          to,
          groupName,
          messageId,
        });
        return { success: true, messageId };
      }

      const errorMsg = "error" in result ? result.error : "Unknown error";
      Sentry.captureException(new Error(errorMsg), {
        tags: { scope: "email", type: "group_invite" },
        contexts: { email: { recipient: to } },
      });
      span.setAttribute("error", true);
      span.setAttribute("error_message", errorMsg);
      console.error("Error sending group invite email:", { to, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  );
};
