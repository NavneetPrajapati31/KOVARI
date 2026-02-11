import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
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
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { currentPassword, newPassword, confirmPassword } = validation.data;

    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match" },
        { status: 400 }
      );
    }

    // Check if new password is different from current
    if (currentPassword === newPassword) {
      return NextResponse.json(
        { error: "New password must be different from current password" },
        { status: 400 }
      );
    }

    const client = await clerkClient();
    
    // Get current user
    const user = await client.users.getUser(userId);
    
    // Check if user has password authentication enabled
    const hasPassword = user.passwordEnabled;
    
    if (!hasPassword) {
      return NextResponse.json(
        { error: "Password authentication is not enabled for your account" },
        { status: 400 }
      );
    }

    try {
      // Update the password
      await client.users.updateUser(userId, {
        password: newPassword,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Password updated successfully",
        },
        { status: 200 }
      );
    } catch (updateError) {
      console.error("Password update error:", updateError);
      
      // Handle specific Clerk errors
      if (updateError && typeof updateError === "object" && "errors" in updateError) {
        const clerkError = updateError as { errors: Array<{ message: string; code: string }> };
        const errorMessage = clerkError.errors[0]?.message;
        
        // Check for common errors
        if (errorMessage?.toLowerCase().includes("password")) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 400 }
          );
        }
        
        return NextResponse.json(
          { error: errorMessage || "Failed to update password" },
          { status: 400 }
        );
      }
      
      throw updateError;
    }
  } catch (error) {
    console.error("Change password API error:", error);
    Sentry.captureException(error, {
      tags: { endpoint: "/api/settings/change-password" },
    });

    return NextResponse.json(
      { error: "Failed to update password. Please try again later." },
      { status: 500 }
    );
  }
}
