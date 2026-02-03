import "server-only";
import * as Sentry from "@sentry/nextjs";

const SENDER_EMAIL = process.env.BREVO_FROM_EMAIL || "noreply@kovari.com";
const SENDER_NAME = process.env.BREVO_FROM_NAME || "KOVARI";

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
      try {
        const SibApiV3Sdk = await import("sib-api-v3-sdk");

        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications["api-key"];
        apiKey.apiKey = process.env.BREVO_API_KEY!;

        span.setAttribute("recipient", to);
        span.setAttribute("sender", SENDER_EMAIL);

        const subject = "Reset your KOVARI password";
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h1 style="font-size: 1.5rem; margin-bottom: 16px;">Reset your password</h1>
  <p style="margin-bottom: 24px;">You requested a password reset for your KOVARI account. Click the button below to set a new password. This link expires in 1 hour.</p>
  <p style="margin-bottom: 24px;">
    <a href="${resetLink}" style="display: inline-block; background: #0f766e; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">Set new password</a>
  </p>
  <p style="font-size: 0.875rem; color: #64748b;">If you didn't request this, you can ignore this email. Your password will not be changed.</p>
  <p style="font-size: 0.875rem; color: #64748b; margin-top: 24px;">— The KOVARI team</p>
</body>
</html>
`.trim();

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.sender = { email: SENDER_EMAIL, name: SENDER_NAME };
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = html;

        const emailData = await apiInstance.sendTransacEmail(sendSmtpEmail);

        const messageId = emailData.messageId || "unknown";
        span.setAttribute("success", true);
        span.setAttribute("message_id", messageId);
        console.log("Password reset email sent successfully:", { to, messageId });
        return { success: true, messageId };
      } catch (error: unknown) {
        const err = error as {
          response?: { body?: { message?: string } };
          message?: string;
        };
        const errorMessage =
          err?.response?.body?.message ||
          err?.message ||
          "Unknown error sending email";

        Sentry.captureException(error, {
          tags: { scope: "email", type: "password_reset" },
          contexts: { email: { recipient: to } },
        });
        span.setAttribute("error", true);
        span.setAttribute("error_message", errorMessage);
        console.error("Error sending password reset email:", { to, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    }
  );
}
