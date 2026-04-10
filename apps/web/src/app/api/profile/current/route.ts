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

    // Fetch explicit onboarding status from users table
    const { data: userStatus, error: userError } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", internalUserId)
      .single();

    if (userError || !userStatus) {
      console.error("Error fetching user onboarding status:", userError);
      // Fallback to false to be safe (forces onboarding)
    }

    const hasCompletedOnboarding = userStatus?.onboarding_completed ?? false;

    const interests = profile?.interests || [];
    
    // Fetch follower ids
    const { data: followerRows, error: followerRowsError } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("following_id", internalUserId);

    if (followerRowsError) {
      console.error("Error fetching follower ids:", followerRowsError);
      throw followerRowsError;
    }

    const followerIds = (followerRows || []).map((r: any) => r.follower_id);
    let followersCount = 0;
    if (followerIds.length > 0) {
      const { count, error: countError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .in("id", followerIds)
        .eq("isDeleted", false);
      if (countError) {
        console.error("Error counting followers:", countError);
        throw countError;
      }
      followersCount = count ?? 0;
    }

    // Fetch following ids
    const { data: followingRows, error: followingRowsError } = await supabase
      .from("user_follows")
      .select("following_id")
      .eq("follower_id", internalUserId);

    if (followingRowsError) {
      console.error("Error fetching following ids:", followingRowsError);
      throw followingRowsError;
    }

    const followingIds = (followingRows || []).map((r: any) => r.following_id);
    let followingCount = 0;
    if (followingIds.length > 0) {
      const { count, error: countError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true })
        .in("id", followingIds)
        .eq("isDeleted", false);
      if (countError) {
        console.error("Error counting following:", countError);
        throw countError;
      }
      followingCount = count ?? 0;
    }

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
      followers: followersCount,
      following: followingCount,
      onboardingCompleted: hasCompletedOnboarding,
      email: profile.email ?? "",
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


