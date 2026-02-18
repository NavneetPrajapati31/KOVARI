import "server-only";
import * as Sentry from "@sentry/nextjs";
import { waitlistConfirmationEmail } from "./email-templates/waitlist-confirmation";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [2000, 4000, 8000];

export interface SendWaitlistConfirmationParams {
  to: string;
  /** If provided, updates waitlist row on success (for confirmation_email_sent_at) */
  waitlistId?: string;
}

/**
 * Sends waitlist confirmation email using Brevo with retries.
 * Retries on timeout, network errors, and Brevo 5xx.
 * Updates waitlist.confirmation_email_sent_at on success when waitlistId is provided.
 * @returns true if sent successfully, false otherwise
 */
export async function sendWaitlistConfirmation({
  to,
  waitlistId,
}: SendWaitlistConfirmationParams): Promise<boolean> {
  if (!process.env.BREVO_API_KEY) {
    console.warn("BREVO_API_KEY is not set. Skipping email send.");
    return false;
  }

  return Sentry.startSpan(
    {
      op: "email.send",
      name: "Send Waitlist Confirmation Email",
    },
    async (span) => {
      try {
        const SibApiV3Sdk = await import("sib-api-v3-sdk");

        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications["api-key"];
        apiKey.apiKey = process.env.BREVO_API_KEY!;
        defaultClient.timeout = 90000;

        const senderEmail =
          process.env.BREVO_FROM_EMAIL || "navneet@kovari.com";
        const senderName = process.env.BREVO_FROM_NAME || "KOVARI";

        span.setAttribute("recipient", to);
        span.setAttribute("sender", senderEmail);

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.sender = { email: senderEmail, name: senderName };
        sendSmtpEmail.subject = "You're early 👀";
        const replyToEmail = process.env.BREVO_REPLY_TO_EMAIL || senderEmail;
        const replyToName = process.env.BREVO_REPLY_TO_NAME || senderName;

        (sendSmtpEmail as any).replyTo = {
          email: replyToEmail,
          name: replyToName,
        };
        sendSmtpEmail.htmlContent = waitlistConfirmationEmail();

        const isRetriable = (err: unknown) => {
          const e = err as {
            message?: string;
            code?: string;
            response?: { status?: number };
          };
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
            const emailData =
              await apiInstance.sendTransacEmail(sendSmtpEmail);
            span.setAttribute("success", true);
            span.setAttribute("message_id", emailData.messageId || "unknown");
            console.log("Waitlist confirmation email sent successfully:", {
              to,
              messageId: emailData.messageId,
              attempt: attempt + 1,
            });

            if (waitlistId) {
              const supabase = createAdminSupabaseClient();
              await supabase
                .from("waitlist")
                .update({ confirmation_email_sent_at: new Date().toISOString() })
                .eq("id", waitlistId);
            }
            return true;
          } catch (err) {
            lastError = err;
            if (attempt < MAX_RETRIES - 1 && isRetriable(err)) {
              await new Promise((r) =>
                setTimeout(r, RETRY_DELAYS_MS[attempt])
              );
            } else {
              break;
            }
          }
        }

        const errorMessage =
          (lastError as {
            response?: { body?: { message?: string } };
            message?: string;
          })?.response?.body?.message ||
          (lastError as { message?: string })?.message ||
          "Unknown error sending email";
        console.error("Error sending waitlist confirmation email:", {
          to,
          error: errorMessage,
          attempts: MAX_RETRIES,
        });

        Sentry.captureException(lastError, {
          tags: { scope: "email", type: "waitlist_confirmation" },
          contexts: { email: { recipient: to } },
        });

        span.setAttribute("error", true);
        span.setAttribute("error_message", errorMessage);
        return false;
      } catch (error: unknown) {
        const errorMessage =
          (error as { message?: string })?.message ||
          "Unknown error sending email";
        console.error("Error sending waitlist confirmation email:", {
          to,
          error: errorMessage,
        });
        Sentry.captureException(error, {
          tags: { scope: "email", type: "waitlist_confirmation" },
          contexts: { email: { recipient: to } },
        });
        span.setAttribute("error", true);
        span.setAttribute("error_message", errorMessage);
        return false;
      }
    }
  );
}
