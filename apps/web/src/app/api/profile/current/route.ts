import * as Sentry from "@sentry/nextjs";
import { createAdminSupabaseClient } from "@kovari/api";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userId = authUser.clerkUserId;
  const internalUserId = authUser.id;

  const supabase = createAdminSupabaseClient();

  try {
    // Get profile data (including interests directly on profiles)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", internalUserId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      Sentry.captureException(profileError, {
        tags: { endpoint: "/api/profile/current", action: "fetch_profile" },
        extra: { clerkUserId: userId, internalUserId },
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
      .eq("user_id", internalUserId)
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
      id: internalUserId, // Add the internal user UUID
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
      verified: profile.verified || false,
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
      extra: { clerkUserId: userId, internalUserId },
    });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}


