import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import bcrypt from "bcryptjs";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { createAdminSupabaseClient } from "@kovari/api";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your new password"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    
    if (!user) {
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

    const supabase = createAdminSupabaseClient();

    // 1. Handle Web User (Clerk)
    if (user.clerkUserId) {
      const client = await clerkClient();
      
      // Get current user from Clerk
      const clerkUser = await client.users.getUser(user.clerkUserId);
      
      // Check if user has password authentication enabled
      if (!clerkUser.passwordEnabled) {
        return NextResponse.json(
          { error: "Password authentication is not enabled for your account" },
          { status: 400 }
        );
      }

      try {
        // Update the password in Clerk
        await client.users.updateUser(user.clerkUserId, {
          password: newPassword,
        });

        // Also update the password_hash in our DB for mobile parity if they ever switch
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await supabase
          .from("users")
          .update({ password_hash: hashedPassword })
          .eq("id", user.id);

        return NextResponse.json(
          { success: true, message: "Password updated successfully" },
          { status: 200 }
        );
      } catch (updateError) {
        console.error("Clerk password update error:", updateError);
        
        if (updateError && typeof updateError === "object" && "errors" in updateError) {
          const clerkError = updateError as { errors: Array<{ message: string; code: string }> };
          const errorMessage = clerkError.errors[0]?.message;
          
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
    } 
    
    // 2. Handle Mobile User (Custom JWT)
    else {
      // Get user's current password hash from DB
      const { data: dbUser, error: dbError } = await supabase
        .from("users")
        .select("password_hash")
        .eq("id", user.id)
        .single();

      if (dbError || !dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Verify current password
      if (!dbUser.password_hash) {
        return NextResponse.json(
          { error: "Password authentication not setup for this account" },
          { status: 400 }
        );
      }

      const isMatch = await bcrypt.compare(currentPassword, dbUser.password_hash);
      if (!isMatch) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      // Hash and update new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      const { error: updateError } = await supabase
        .from("users")
        .update({ password_hash: hashedPassword })
        .eq("id", user.id);

      if (updateError) {
        console.error("Mobile password update error:", updateError);
        return NextResponse.json({ error: "Failed to update password" }, { status: 500 });
      }

      return NextResponse.json(
        { success: true, message: "Password updated successfully" },
        { status: 200 }
      );
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

