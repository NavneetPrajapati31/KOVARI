import "server-only";
import * as Sentry from "@sentry/nextjs";
import { passwordResetEmail } from "./email-templates/password-reset";
import { groupInviteEmail } from "./email-templates/group-invite";

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
        const html = passwordResetEmail({ resetLink });

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
        console.log("Password reset email sent successfully:", {
          to,
          messageId,
        });
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
        console.error("Error sending password reset email:", {
          to,
          error: errorMessage,
        });
        return { success: false, error: errorMessage };
      }
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
      try {
        const SibApiV3Sdk = await import("sib-api-v3-sdk");

        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications["api-key"];
        apiKey.apiKey = process.env.BREVO_API_KEY!;

        span.setAttribute("recipient", to);
        span.setAttribute("sender", SENDER_EMAIL);

        const subject = `You're invited to join ${groupName} on KOVARI`;
        const html = groupInviteEmail({
          groupName,
          inviteLink,
          senderName,
        });

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
        console.log("Group invite email sent successfully:", {
          to,
          groupName,
          messageId,
        });
        console.log(
          "If the email is not in inbox: check Spam/Junk, then Brevo dashboard (Transactional → Logs). See EMAIL_DELIVERABILITY.md for more."
        );
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
          tags: { scope: "email", type: "group_invite" },
          contexts: { email: { recipient: to } },
        });
        span.setAttribute("error", true);
        span.setAttribute("error_message", errorMessage);
        console.error("Error sending group invite email:", {
          to,
          error: errorMessage,
        });
        return { success: false, error: errorMessage };
      }
    }
  );
};
