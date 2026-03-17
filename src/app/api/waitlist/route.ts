import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { sendWaitlistConfirmation } from "@/lib/send-waitlist-confirmation";

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
        const { email, source = "unknown" } = body;

        span.setAttribute("email_provided", !!email);
        span.setAttribute("source", source);

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

        // Check for disposable email domains
        const domain = normalizedEmail.split("@")[1];
        const DISPOSABLE_DOMAINS = [
          "mailinator.com",
          "guerrillamail.com",
          "guerrillamail.net",
          "guerrillamail.org",
          "guerrillamailblock.com",
          "guerrillamail.biz",
          "temp-mail.org",
          "yopmail.com",
          "10minutemail.com",
          "dispostable.com",
          "getnada.com",
          "sharklasers.com",
          "trashmail.com",
        ];

        if (DISPOSABLE_DOMAINS.includes(domain)) {
          span.setAttribute("error", "disposable_email");
          return NextResponse.json(
            { error: "Please use a real email address" },
            { status: 400 }
          );
        }

        // Create Supabase client
        const supabase = createAdminSupabaseClient();

        // Insert email into waitlist table
        const { data, error } = await supabase
          .from("waitlist")
          .insert({ 
            email: normalizedEmail,
            source: source 
          })
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

        // Send confirmation email via after() - ensures it runs to completion before
        // function freezes (uses waitUntil on Vercel). Failed sends are retried by cron.
        after(async () => {
          await sendWaitlistConfirmation({ to: normalizedEmail, waitlistId: data.id });
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
