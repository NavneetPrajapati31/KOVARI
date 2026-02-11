import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const changeEmailSchema = z.object({
  newEmail: z.string().email("Invalid email format"),
  confirmEmail: z.string().email("Invalid email format"),
});

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const validation = changeEmailSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { newEmail, confirmEmail } = validation.data;

    // Check if emails match
    if (newEmail !== confirmEmail) {
      return NextResponse.json(
        { error: "Email addresses do not match" },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    
    // Get current user
    const user = await client.users.getUser(userId);
    
    // Check if new email is same as current
    if (user.emailAddresses.some(email => email.emailAddress === newEmail)) {
      return NextResponse.json(
        { error: "This is already your current email address" },
        { status: 400 }
      );
    }

    // Check if email already exists in Clerk
    const { data: existingUsers } = await client.users.getUserList({
      emailAddress: [newEmail],
      limit: 1,
    });

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json(
        { error: "This email address is already in use" },
        { status: 409 }
      );
    }

    // Create new email address for the user (this will send verification email)
    await client.emailAddresses.createEmailAddress({
      userId,
      emailAddress: newEmail,
      verified: false,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Verification email sent. Please check your inbox to verify your new email address.",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Change email API error:", error);
    Sentry.captureException(error, {
      tags: { endpoint: "/api/settings/change-email" },
    });
    
    // Handle Clerk-specific errors
    if (error && typeof error === "object" && "errors" in error) {
      const clerkError = error as { errors: Array<{ message: string }> };
      return NextResponse.json(
        { error: clerkError.errors[0]?.message || "Failed to update email" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to update email. Please try again later." },
      { status: 500 }
    );
  }
}
