import "server-only";
import { waitlistConfirmationEmail } from "./email-templates/waitlist-confirmation";
import * as Sentry from "@sentry/nextjs";

// Lazy load Brevo SDK only on server-side to avoid client bundling issues
async function getBrevoClient() {
  // Dynamic import to ensure this only runs on the server
  const SibApiV3Sdk = await import("sib-api-v3-sdk");

  // Configure Brevo API client
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];

  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  apiKey.apiKey = process.env.BREVO_API_KEY;

  return {
    TransactionalEmailsApi: SibApiV3Sdk.TransactionalEmailsApi,
    SendSmtpEmail: SibApiV3Sdk.SendSmtpEmail,
  };
}

interface SendWaitlistConfirmationParams {
  to: string;
}

/**
 * Sends a waitlist confirmation email using Brevo
 * @param params - Email parameters
 * @returns Promise that resolves when email is sent successfully
 */
export const sendWaitlistConfirmation = async ({
  to,
}: SendWaitlistConfirmationParams): Promise<void> => {
  return Sentry.startSpan(
    {
      op: "email.send",
      name: "Send Waitlist Confirmation Email",
    },
    async (span) => {
      // Check if API key is configured
      if (!process.env.BREVO_API_KEY) {
        const errorMessage = "BREVO_API_KEY is not configured";
        console.warn(errorMessage);
        span.setAttribute("error", "missing_api_key");
        // Don't throw error - allow signup to succeed even if email fails
        return;
      }

      // Get sender email from environment or use default
      const senderEmail = process.env.BREVO_FROM_EMAIL || "noreply@kovari.com";
      const senderName = process.env.BREVO_FROM_NAME || "KOVARI";

      span.setAttribute("recipient", to);
      span.setAttribute("sender", senderEmail);

      try {
        // Lazy load Brevo SDK
        const { TransactionalEmailsApi, SendSmtpEmail } =
          await getBrevoClient();
        const apiInstance = new TransactionalEmailsApi();

        const sendSmtpEmail = new SendSmtpEmail();
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.sender = { email: senderEmail, name: senderName };
        sendSmtpEmail.subject = "You're on the KOVARI waitlist";
        sendSmtpEmail.htmlContent = waitlistConfirmationEmail();

        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);

        span.setAttribute("success", true);
        span.setAttribute("message_id", data.messageId || "unknown");
        console.log("Waitlist confirmation email sent successfully:", {
          to,
          messageId: data.messageId,
        });
      } catch (error: any) {
        // Log error but don't throw - we don't want email failures to break signup
        const errorMessage =
          error?.response?.body?.message ||
          error?.message ||
          "Unknown error sending email";
        console.error("Error sending waitlist confirmation email:", {
          to,
          error: errorMessage,
        });

        Sentry.captureException(error, {
          tags: {
            scope: "email",
            type: "waitlist_confirmation",
          },
          contexts: {
            email: {
              recipient: to,
              sender: senderEmail,
            },
          },
        });

        span.setAttribute("error", true);
        span.setAttribute("error_message", errorMessage);
        // Silently fail - don't throw error
      }
    }
  );
};
