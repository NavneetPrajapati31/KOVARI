import { clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { createAdminSupabaseClient } from "@kovari/api";
import { getAuthenticatedUser } from "@/lib/auth/get-user";

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

    // 2. Handle Email (Special Case)
    if (field === "email") {
      const emailValue = typeof value === "string" ? value.trim() : String(value ?? "");
      if (!emailValue) {
        return new Response(JSON.stringify({ error: "Email value is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Update profiles table
      const { error: profileEmailError } = await supabase
        .from("profiles")
        .update({ email: emailValue })
        .eq("user_id", user.id);

      if (profileEmailError) {
        console.error("Error updating profile email:", profileEmailError);
        return new Response(JSON.stringify({ error: "Failed to update profile email" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }

      // If mobile user, also update users table (Unified SOT)
      if (!user.clerkUserId) {
        const { error: userEmailError } = await supabase
          .from("users")
          .update({ email: emailValue })
          .eq("id", user.id);

        if (userEmailError) {
          console.error("Error updating user email (mobile):", userEmailError);
          // Non-fatal for the profile update but log it
        }
      }

      return new Response(JSON.stringify({ message: "Profile email updated successfully", field: "email", value: emailValue }), {
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


