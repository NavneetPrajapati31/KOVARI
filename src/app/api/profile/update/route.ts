import { auth } from "@clerk/nextjs/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

const updateProfileSchema = z.object({
  field: z.string(),
  value: z.union([z.string(), z.number(), z.array(z.string())]),
});

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) {
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

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: cookieStore }
  );

  try {
    // Get user from users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Handle interests field separately (stored in travel_preferences table)
    if (field === "interests") {
      // Check if travel preferences record exists
      const { data: existingPrefs } = await supabase
        .from("travel_preferences")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingPrefs) {
        // Update existing record
        const { error: updateError } = await supabase
          .from("travel_preferences")
          .update({ interests: value })
          .eq("user_id", user.id);

        if (updateError) {
          console.error("Error updating travel preferences:", updateError);
          return new Response(
            JSON.stringify({ error: "Failed to update interests" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      } else {
        // Create new record
        const { error: insertError } = await supabase
          .from("travel_preferences")
          .insert({
            user_id: user.id,
            interests: value,
            destinations: [], // Default empty array
            start_date: new Date().toISOString(), // Default date
            end_date: new Date().toISOString(), // Default date
          });

        if (insertError) {
          console.error("Error creating travel preferences:", insertError);
          return new Response(
            JSON.stringify({ error: "Failed to create interests record" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      }

      return new Response(
        JSON.stringify({
          message: "Interests updated successfully",
          field,
          value,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Map frontend field names to database column names for profiles table
    const fieldMapping: Record<string, string> = {
      avatar: "profile_photo",
      name: "name",
      username: "username",
      age: "age",
      gender: "gender",
      nationality: "nationality",
      profession: "job",
      languages: "languages",
      bio: "bio",
    };

    const dbField = fieldMapping[field];
    if (!dbField) {
      return new Response(JSON.stringify({ error: "Invalid field name" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Transform value if needed
    let transformedValue = value;
    if (field === "gender" && typeof value === "string") {
      transformedValue = value.charAt(0).toUpperCase() + value.slice(1);
    }

    // Check if username is already taken (only for username updates)
    if (field === "username" && typeof value === "string") {
      const { data: existingProfile, error: existingProfileError } =
        await supabase
          .from("profiles")
          .select("user_id")
          .ilike("username", value)
          .not("user_id", "eq", user.id)
          .maybeSingle();

      if (existingProfileError) {
        console.error("Error checking username:", existingProfileError);
        return new Response(
          JSON.stringify({ error: "Error checking username availability" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      if (existingProfile) {
        return new Response(
          JSON.stringify({ error: "Username is already taken" }),
          { status: 409, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ [dbField]: transformedValue })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update profile" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Update Clerk user data for specific fields
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();

      // Update Clerk username if username was changed
      if (field === "username" && typeof value === "string") {
        await client.users.updateUser(userId, {
          username: value,
        });
      }

      // Update Clerk name if name was changed
      if (field === "name" && typeof value === "string") {
        await client.users.updateUser(userId, {
          firstName: value.split(" ")[0] || "",
          lastName: value.split(" ").slice(1).join(" ") || "",
        });
      }
    } catch (err) {
      console.error("Error updating Clerk user:", err);
      // Don't fail the request, just log the error
      // The database update was successful, so we return success
    }

    return new Response(
      JSON.stringify({
        message: "Profile updated successfully",
        field,
        value: transformedValue,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in profile update:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
