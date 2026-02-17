import 'server-only';
import * as Sentry from '@sentry/nextjs';
import * as Brevo from '@getbrevo/brevo';

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [2000, 4000, 8000];

// Initialize Brevo API Instance
const getBrevoApiInstance = () => {
  if (!process.env.BREVO_API_KEY) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  const apiInstance = new Brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(
    Brevo.TransactionalEmailsApiApiKeys.apiKey,
    process.env.BREVO_API_KEY,
  );
  return apiInstance;
};

const isRetriableError = (error: unknown): boolean => {
  const e = error as {
    message?: string;
    code?: string;
    response?: { status?: number };
  };
  return (
    e?.message?.includes('Timeout') ||
    e?.message?.includes('timeout') ||
    e?.code === 'ECONNRESET' ||
    e?.code === 'ETIMEDOUT' ||
    e?.code === 'ENOTFOUND' ||
    (e?.response?.status != null && e.response.status >= 500)
  );
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
  category = 'admin_notification',
}: SendEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> => {
  return Sentry.startSpan(
    {
      op: 'email.send',
      name: 'Send Admin Email',
    },
    async (span) => {
      // Check if API key is configured
      if (!process.env.BREVO_API_KEY) {
        const errorMessage = 'BREVO_API_KEY is not configured';
        console.warn(errorMessage);
        span.setAttribute('error', 'missing_api_key');
        return { success: false, error: errorMessage };
      }

      // Get sender email from environment or use default
      const senderEmail = process.env.BREVO_FROM_EMAIL || 'noreply@kovari.com';
      const senderName = process.env.BREVO_FROM_NAME || 'KOVARI Admin';

      span.setAttribute('recipient', to);
      span.setAttribute('sender', senderEmail);

      const apiInstance = getBrevoApiInstance();
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.subject = subject;
      sendSmtpEmail.htmlContent = html;
      sendSmtpEmail.sender = { name: senderName, email: senderEmail };
      sendSmtpEmail.to = [{ email: to }];

      let lastError: unknown;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
          const messageId =
            (data as { messageId?: string; body?: { messageId?: string } })
              .messageId ||
            (data as { messageId?: string; body?: { messageId?: string } }).body
              ?.messageId;

          span.setAttribute('success', true);
          span.setAttribute('message_id', messageId || 'unknown');
          console.log('Admin email sent successfully:', {
            to,
            messageId,
            subject,
          });

          return { success: true, messageId };
        } catch (error: unknown) {
          lastError = error;
          if (attempt < MAX_RETRIES - 1 && isRetriableError(error)) {
            await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
          } else {
            break;
          }
        }
      }

      const err = lastError as {
        body?: { message?: string };
        message?: string;
      };
      const errorMessage =
        err?.body?.message || err?.message || 'Unknown error sending email';

      console.error('Error sending admin email:', {
        to,
        subject,
        error: errorMessage,
        attempts: MAX_RETRIES,
      });

      Sentry.captureException(lastError, {
        tags: { scope: 'email', type: category },
        contexts: {
          email: { recipient: to, sender: senderEmail, subject },
        },
      });

      span.setAttribute('error', true);
      span.setAttribute('error_message', errorMessage);

      return { success: false, error: errorMessage };
    },
  );
};
