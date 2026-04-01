import * as Sentry from "@sentry/nextjs";
import { createAdminSupabaseClient, ProfileResponseSchema, ProfileResponse } from "@kovari/api";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
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

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      Sentry.captureException(profileError || new Error("Profile not found"), {
        tags: { endpoint: "/api/profile/current", action: "fetch_profile" },
        extra: { clerkUserId: userId, internalUserId },
      });
      // ❗ HANDLE NO PROFILE returns 404
      return Response.json({ error: "Profile not found" }, { status: 404 });
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
    const hasCompletedOnboarding = !!(usernameSet && nameSet);

    const interests = profile?.interests || [];

    // ✅ SANITIZE RESPONSE
    // Transform data to match ProfileResponse structure
    const profileData: ProfileResponse = {
      id: internalUserId, // Add the internal user UUID
      avatar: profile.profile_photo ?? "",
      name: profile.name ?? "",
      username: profile.username ?? "",
      age: profile.age ?? 0,
      gender: profile.gender ?? "Prefer not to say",
      nationality: profile.nationality ?? "",
      profession: profile.job ?? "",
      interests,
      languages: profile.languages || [],
      bio: profile.bio ?? "",
      birthday: profile.birthday ?? "",
      location: profile.location ?? "",
      location_details: profile.location_details || {},
      religion: profile.religion ?? "",
      smoking: profile.smoking ?? "",
      drinking: profile.drinking ?? "",
      personality: profile.personality ?? "",
      foodPreference: profile.food_preference ?? "",
      verified: profile.verified ?? false,
      // Travel preferences
      destinations: travelPrefs?.destinations || [],
      tripFocus: travelPrefs?.trip_focus || [],
      travelFrequency: travelPrefs?.frequency ?? "",
      onboardingCompleted: hasCompletedOnboarding,
    };

    const parsed = ProfileResponseSchema.parse(profileData);
    console.info("PROFILE_RESPONSE", parsed);

    return Response.json(parsed);
  } catch (error) {
    console.error("Error in profile fetch:", error);
    Sentry.captureException(error, {
      tags: { endpoint: "/api/profile/current", action: "handler_error" },
      extra: { clerkUserId: userId, internalUserId },
    });
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}


