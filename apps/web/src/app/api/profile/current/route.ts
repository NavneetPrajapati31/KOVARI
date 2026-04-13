import * as Sentry from "@sentry/nextjs";
import { createAdminSupabaseClient, ProfileResponseSchema, ProfileResponse } from "@kovari/api";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { NextRequest } from "next/server";
import { generateRequestId } from "@/lib/api/requestId";
import { formatStandardResponse, formatErrorResponse } from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";
import { logger } from "@/lib/api/logger";

export async function GET(request: NextRequest) {
  const start = Date.now();
  const requestId = generateRequestId();
  const authUser = await getAuthenticatedUser(request);
  if (!authUser) {
    return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);
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
      logger.error(requestId, "Error fetching profile", profileError);
      Sentry.captureException(profileError || new Error("Profile not found"), {
        tags: { endpoint: "/api/profile/current", action: "fetch_profile" },
        extra: { clerkUserId: userId, internalUserId },
      });
      return formatErrorResponse("Profile not found", ApiErrorCode.NOT_FOUND, requestId, 404);
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
      logger.error(requestId, "Error fetching user onboarding status", userError);
      // Fallback to false to be safe (forces onboarding)
    }

    let hasCompletedOnboarding = Boolean(userStatus?.onboarding_completed ?? false);

    // 🚀 AUTO-REPAIR: If profile exists but flag is false, mark as complete.
    // This resolves redirect loops for legacy users.
    if (profile && !hasCompletedOnboarding) {
      const { error: repairError } = await supabase
        .from("users")
        .update({ onboarding_completed: true })
        .eq("id", internalUserId);
      
      if (!repairError) {
        hasCompletedOnboarding = true;
        logger.info(requestId, "Auto-repaired onboarding flag for profile owner", { internalUserId });
      } else {
        logger.error(requestId, "Failed to auto-repair onboarding flag", repairError);
      }
    }

    const interests = profile?.interests || [];
    
    // Fetch follower ids
    const { data: followerRows, error: followerRowsError } = await supabase
      .from("user_follows")
      .select("follower_id")
      .eq("following_id", internalUserId);

    if (followerRowsError) {
      logger.error(requestId, "Error fetching follower ids", followerRowsError);
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
        logger.error(requestId, "Error counting followers", countError);
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
      logger.error(requestId, "Error fetching following ids", followingRowsError);
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
        logger.error(requestId, "Error counting following", countError);
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
    
    return formatStandardResponse(
      parsed,
      { contractState: 'clean', degraded: false },
      { requestId, latencyMs: Date.now() - start }
    );
  } catch (error) {
    logger.error(requestId, "Error in profile fetch", error);
    Sentry.captureException(error, {
      tags: { endpoint: "/api/profile/current", action: "handler_error" },
      extra: { clerkUserId: userId, internalUserId },
    });
    return formatErrorResponse("Internal failure", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}


