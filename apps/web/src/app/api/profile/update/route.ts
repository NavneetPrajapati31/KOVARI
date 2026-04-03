import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { createAdminSupabaseClient, createRouteHandlerSupabaseClientWithServiceRole, sendRegistrationVerificationEmail } from "@kovari/api";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import crypto from "crypto";

const updateProfileSchema = z.object({
  field: z.string(),
  value: z.any(),
});

export async function PATCH(req: Request) {
  const user = await getAuthenticatedUser(req as any);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const result = updateProfileSchema.safeParse(body);

  if (!result.success) {
    return new Response(JSON.stringify({ error: "Invalid request data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { field, value } = result.data;
  const supabase = createAdminSupabaseClient();

  try {
    // 1. Handle Interests
    if (field === "interests") {
      const { error: interestsUpdateError } = await supabase
        .from("profiles")
        .update({ interests: value })
        .eq("user_id", user.id);

      if (interestsUpdateError) {
        console.error("Error updating profile interests:", interestsUpdateError);
        return new Response(JSON.stringify({ error: "Failed to update interests" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Interests updated successfully", field, value }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Handle Email (Verification Flow)
    if (field === "email") {
      const emailValue = typeof value === "string" ? value.trim() : String(value ?? "");
      if (!emailValue) {
        return new Response(JSON.stringify({ error: "Email value is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if email already in use
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .ilike("email", emailValue)
        .maybeSingle();

      if (existingUser && existingUser.id !== user.id) {
        return new Response(JSON.stringify({ error: "Email already in use" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Generate OTP
      const otp = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      const adminSupabase = createRouteHandlerSupabaseClientWithServiceRole();

      // Upsert to verification_codes
      const { error: otpError } = await adminSupabase
        .from("verification_codes")
        .upsert({
          email: emailValue,
          code: otp,
          expires_at: expiresAt.toISOString(),
          payload: { pendingEmail: emailValue, userId: user.id },
          is_sending: true,
          last_sent_at: new Date().toISOString(),
        }, { onConflict: 'email' });

      if (otpError) {
        console.error("Failed to store OTP for email change:", otpError);
        return new Response(JSON.stringify({ error: "Failed to initialize verification" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Dispatch Email
      try {
        await sendRegistrationVerificationEmail({ to: emailValue, code: otp });
      } catch (emailError) {
        console.error("Email dispatch failed:", emailError);
        await adminSupabase.from("verification_codes").update({ is_sending: false }).eq("email", emailValue);
        return new Response(JSON.stringify({ error: "Verification email service unavailable" }), {
          status: 503,
          headers: { "Content-Type": "application/json" },
        });
      }

      await adminSupabase.from("verification_codes").update({ is_sending: false }).eq("email", emailValue);

      return new Response(JSON.stringify({
        verificationRequired: true,
        message: "A verification code has been sent to your new email."
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Mapping...
    const fieldMapping: Record<string, string> = {
      avatar: "profile_photo",
      name: "name",
      username: "username",
      email: "email",
      age: "age",
      gender: "gender",
      nationality: "nationality",
      profession: "job",
      languages: "languages",
      bio: "bio",
      interests: "interests",
      location: "location",
      location_details: "location_details",
      birthday: "birthday",
      religion: "religion",
      smoking: "smoking",
      drinking: "drinking",
      personality: "personality",
      foodPreference: "food_preference",
      destinations: "destinations",
      tripFocus: "trip_focus",
      travelFrequency: "frequency",
    };

    const travelFields = ["destinations", "tripFocus", "travelFrequency"];
    if (travelFields.includes(field)) {
      const dbField = fieldMapping[field];
      const { error: travelUpdateError } = await supabase
        .from("travel_preferences")
        .upsert({ user_id: user.id, [dbField]: value }, { onConflict: "user_id" });

      if (travelUpdateError) {
        console.error("Error updating travel preferences:", travelUpdateError);
        return new Response(JSON.stringify({ error: "Failed to update travel preferences" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ message: "Travel preferences updated successfully", field, value }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const dbField = fieldMapping[field];
    if (!dbField) {
      return new Response(JSON.stringify({ error: "Invalid field name" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Username availability check
    if (field === "username" && typeof value === "string") {
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .ilike("username", value)
        .not("user_id", "eq", user.id)
        .maybeSingle();

      if (existingProfile) {
        return new Response(JSON.stringify({ error: "Username is already taken" }), {
          status: 409,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Update Profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ [dbField]: value })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(JSON.stringify({ error: "Failed to update profile" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sync to Clerk (WEB ONLY)
    if (user.clerkUserId) {
      try {
        const client = await clerkClient();
        if (field === "username") {
          await client.users.updateUser(user.clerkUserId, { username: value });
        } else if (field === "name") {
          await client.users.updateUser(user.clerkUserId, {
            firstName: value.split(" ")[0] || "",
            lastName: value.split(" ").slice(1).join(" ") || "",
          });
        }
      } catch (err) {
        console.error("Error updating Clerk user:", err);
      }
    }

    return new Response(JSON.stringify({ message: "Profile updated successfully", field, value }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in profile update:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


