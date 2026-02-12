import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createAdminSupabaseClient();

  try {
    // Get user from users table
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .eq("isDeleted", false)
      .single();

    if (userError || !user) {
      console.error("[api/profile/current] User lookup failed", {
        clerkUserId: userId,
        code: userError?.code,
        message: userError?.message,
        details: (userError as any)?.details,
        hint: (userError as any)?.hint,
      });
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get profile data (including interests directly on profiles)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      Sentry.captureException(profileError, {
        tags: { endpoint: "/api/profile/current", action: "fetch_profile" },
        extra: { clerkUserId: userId, internalUserId: user.id },
      });
      return new Response(
        JSON.stringify({ error: "Failed to fetch profile data" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    // Get travel preferences
    const { data: travelPrefs } = await supabase
      .from("travel_preferences")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Consider onboarding complete only when both username and name are set.
    // DB trigger may create a profile with a default username; name is only set by the onboarding form.
    const usernameSet =
      profile?.username != null && String(profile.username).trim() !== "";
    const nameSet = profile?.name != null && String(profile.name).trim() !== "";
    const hasCompletedOnboarding = usernameSet && nameSet;
    if (!hasCompletedOnboarding) {
      return new Response(
        JSON.stringify({ error: "Profile incomplete", incomplete: true }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }

    const interests = profile?.interests || [];

    // Transform data to match ProfileEditForm structure
    const profileData = {
      id: user.id, // Add the internal user UUID
      avatar: profile.profile_photo || "",
      name: profile.name || "",
      username: profile.username || "",
      age: profile.age || 0,
      gender: profile.gender || "Prefer not to say",
      nationality: profile.nationality || "",
      profession: profile.job || "",
      interests,
      languages: profile.languages || [],
      bio: profile.bio || "",
      birthday: profile.birthday || "",
      location: profile.location || "",
      location_details: profile.location_details || {},
      religion: profile.religion || "",
      smoking: profile.smoking || "",
      drinking: profile.drinking || "",
      personality: profile.personality || "",
      foodPreference: profile.food_preference || "",
      // Travel preferences
      destinations: travelPrefs?.destinations || [],
      tripFocus: travelPrefs?.trip_focus || [],
      travelFrequency: travelPrefs?.frequency || "",
    };

    return new Response(JSON.stringify(profileData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in profile fetch:", error);
    Sentry.captureException(error, {
      tags: { endpoint: "/api/profile/current", action: "handler_error" },
      extra: { clerkUserId: userId },
    });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
