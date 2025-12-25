import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import * as Sentry from "@sentry/nextjs";
import { waitlistConfirmationEmail } from "@/lib/email-templates/waitlist-confirmation";

/**
 * Sends waitlist confirmation email using Brevo
 * This function is defined in the API route to avoid client bundling issues
 */
async function sendWaitlistEmail(to: string): Promise<void> {
  // Only send email if API key is configured
  if (!process.env.BREVO_API_KEY) {
    console.warn("BREVO_API_KEY is not set. Skipping email send.");
    return;
  }

  return Sentry.startSpan(
    {
      op: "email.send",
      name: "Send Waitlist Confirmation Email",
    },
    async (span) => {
      try {
        // Dynamic import to ensure this only loads on the server
        const SibApiV3Sdk = await import("sib-api-v3-sdk");

        // Configure Brevo API client
        const defaultClient = SibApiV3Sdk.ApiClient.instance;
        const apiKey = defaultClient.authentications["api-key"];
        apiKey.apiKey = process.env.BREVO_API_KEY!;

        // Get sender email from environment or use default
        const senderEmail =
          process.env.BREVO_FROM_EMAIL || "noreply@kovari.com";
        const senderName = process.env.BREVO_FROM_NAME || "KOVARI";

        span.setAttribute("recipient", to);
        span.setAttribute("sender", senderEmail);

        const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
        const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
        sendSmtpEmail.to = [{ email: to }];
        sendSmtpEmail.sender = { email: senderEmail, name: senderName };
        sendSmtpEmail.subject = "You're on the KOVARI waitlist";
        sendSmtpEmail.htmlContent = waitlistConfirmationEmail();

        const emailData = await apiInstance.sendTransacEmail(sendSmtpEmail);

        span.setAttribute("success", true);
        span.setAttribute("message_id", emailData.messageId || "unknown");
        console.log("Waitlist confirmation email sent successfully:", {
          to,
          messageId: emailData.messageId,
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
            },
          },
        });

        span.setAttribute("error", true);
        span.setAttribute("error_message", errorMessage);
        // Silently fail - don't throw error
      }
    }
  );
}

/**
 * POST /api/waitlist
 * Public endpoint for adding emails to the waitlist
 *
 * Payload:
 * {
 *   "email": "user@example.com"
 * }
 */
export async function POST(req: NextRequest) {
  return Sentry.startSpan(
    {
      op: "http.server",
      name: "POST /api/waitlist",
    },
    async (span) => {
      try {
        // Parse request body
        const body = await req.json();
        const { email } = body;

        span.setAttribute("email_provided", !!email);

        // Validate email
        if (!email || typeof email !== "string") {
          span.setAttribute("error", "missing_email");
          return NextResponse.json(
            { error: "Email is required" },
            { status: 400 }
          );
        }

        // Basic email format validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const normalizedEmail = email.trim().toLowerCase();

        if (!emailRegex.test(normalizedEmail)) {
          span.setAttribute("error", "invalid_email_format");
          return NextResponse.json(
            { error: "Invalid email format" },
            { status: 400 }
          );
        }

        // Create Supabase client
        const supabase = createRouteHandlerSupabaseClient();

        // Insert email into waitlist table
        const { data, error } = await supabase
          .from("waitlist")
          .insert({ email: normalizedEmail })
          .select()
          .single();

        if (error) {
          // Check if it's a duplicate email error (unique constraint violation)
          if (error.code === "23505" || error.message.includes("unique")) {
            span.setAttribute("error", "duplicate_email");
            return NextResponse.json(
              { error: "This email is already on the waitlist" },
              { status: 409 }
            );
          }

          // Log unexpected errors to Sentry
          Sentry.captureException(error);
          span.setAttribute("error", "database_error");
          console.error("Error inserting email into waitlist:", error);
          return NextResponse.json(
            { error: "Failed to add email to waitlist" },
            { status: 500 }
          );
        }

        span.setAttribute("success", true);
        span.setAttribute("waitlist_id", data.id);

        // Send confirmation email (non-blocking - errors are handled internally)
        // This runs in the background and won't block the response
        sendWaitlistEmail(normalizedEmail).catch((emailError: unknown) => {
          // Error handling is done inside the function, this is just a safety net
          console.error("Unexpected error in email sending:", emailError);
        });

        return NextResponse.json(
          {
            success: true,
            message: "Successfully added to waitlist",
            data: {
              id: data.id,
              email: data.email,
              created_at: data.created_at,
            },
          },
          { status: 201 }
        );
      } catch (error: any) {
        // Handle JSON parsing errors or other unexpected errors
        Sentry.captureException(error);
        span.setAttribute("error", "unexpected_error");
        console.error("Unexpected error in waitlist API:", error);

        if (error instanceof SyntaxError) {
          return NextResponse.json(
            { error: "Invalid request body" },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: "Internal server error" },
          { status: 500 }
        );
      }
    }
  );
}
