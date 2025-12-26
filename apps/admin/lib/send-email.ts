import "server-only";
import * as Sentry from "@sentry/nextjs";

// Lazy load Brevo SDK only on server-side to avoid client bundling issues
async function getBrevoClient() {
  // Dynamic import to ensure this only runs on the server
  const SibApiV3Sdk = await import("sib-api-v3-sdk");

  // Configure Brevo API client
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  const apiKey = defaultClient.authentications["api-key"];

  // Debug log (masked)
  const key = process.env.BREVO_API_KEY;
  console.log("Brevo Client Init - Key configured:", !!key, "Length:", key?.length);

  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  apiKey.apiKey = process.env.BREVO_API_KEY;

  return {
    TransactionalEmailsApi: SibApiV3Sdk.TransactionalEmailsApi,
    SendSmtpEmail: SibApiV3Sdk.SendSmtpEmail,
  };
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  category?: string;
}

export const sendEmail = async ({
  to,
  subject,
  html,
  category = "admin_notification",
}: SendEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  return Sentry.startSpan(
    {
      op: "email.send",
      name: "Send Admin Email",
    },
    async (span) => {
      // Check if API key is configured
      if (!process.env.BREVO_API_KEY) {
        const errorMessage = "BREVO_API_KEY is not configured";
        console.warn(errorMessage);
        span.setAttribute("error", "missing_api_key");
        return { success: false, error: errorMessage };
      }

      // Get sender email from environment or use default
      const senderEmail = process.env.BREVO_FROM_EMAIL || "noreply@kovari.com";
      const senderName = process.env.BREVO_FROM_NAME || "KOVARI Admin";

      console.log(`Attempting to send email to ${to} from ${senderEmail}`);

      span.setAttribute("recipient", to);
      span.setAttribute("sender", senderEmail);

      try {
        // Lazy load Brevo SDK
        const { TransactionalEmailsApi, SendSmtpEmail } = await getBrevoClient();
        const apiInstance = new TransactionalEmailsApi();

        const sendSmtpEmail = new SendSmtpEmail();
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.sender = { email: senderEmail, name: senderName };
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = html;
        if (category) {
            // Brevo tags support if needed in future
            // sendSmtpEmail.tags = [category];
        }

        console.log("Calling Brevo API...");
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("Brevo API Response:", JSON.stringify(data, null, 2));

        span.setAttribute("success", true);
        span.setAttribute("message_id", data.messageId || "unknown");
        console.log("Email sent successfully:", {
          to,
          messageId: data.messageId,
          subject
        });
        
        return { success: true, messageId: data.messageId };
      } catch (error: any) {
        const errorMessage =
          error?.response?.body?.message ||
          error?.message ||
          "Unknown error sending email";
        
        console.error("Error sending email:", {
          to,
          subject,
          error: errorMessage,
          fullError: error
        });

        Sentry.captureException(error, {
          tags: {
            scope: "email",
            type: category,
          },
          contexts: {
            email: {
              recipient: to,
              sender: senderEmail,
              subject,
            },
          },
        });

        span.setAttribute("error", true);
        span.setAttribute("error_message", errorMessage);
        
        return { success: false, error: errorMessage };
      }
    }
  );
};
