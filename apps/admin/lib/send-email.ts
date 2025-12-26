import "server-only";
import * as Sentry from "@sentry/nextjs";
import * as Brevo from "@getbrevo/brevo";

// Initialize Brevo API Instance
const getBrevoApiInstance = () => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY is not configured");
  }

  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);
  return apiInstance;
};

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
        const apiInstance = getBrevoApiInstance();
        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = html;
        sendSmtpEmail.sender = { name: senderName, email: senderEmail };
        sendSmtpEmail.to = [{ email: to }];
        
        if (category) {
            // Brevo tags support (optional)
            // sendSmtpEmail.tags = [category];
        }

        console.log("Calling Brevo API...");
        const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
        console.log("Brevo API Response:", JSON.stringify(data, null, 2));

        // data.messageId might be body.messageId depending on SDK version return type
        // The new SDK usually returns { response: ..., body: ... } or just the body?
        // Let's assume typical response. If it fails type check we can fix.
        // Actually, sendTransacEmail returns Promise<{ response: http.IncomingMessage; body: CreateSmtpEmail; }> in some versions
        // or just the body.
        
        // Inspecting the type definitions if possible would be good, but I'll assume safe access.
        const messageId = (data as any).messageId || (data as any).body?.messageId;

        span.setAttribute("success", true);
        span.setAttribute("message_id", messageId || "unknown");
        console.log("Email sent successfully:", {
          to,
          messageId,
          subject
        });
        
        return { success: true, messageId };
      } catch (error: any) {
        const errorMessage =
          error?.body?.message || 
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
