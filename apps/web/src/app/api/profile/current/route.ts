import * as Sentry from "@sentry/nextjs";
import { createAdminSupabaseClient, ProfileResponseSchema, ProfileResponse } from "@kovari/api";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { NextRequest } from "next/server";
import { generateRequestId } from "@/lib/api/requestId";
import { formatStandardResponse, formatErrorResponse } from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";
import { logger } from "@/lib/api/logger";
import { profileMapper } from "@/lib/mappers/profileMapper";

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
    // 1. Unified Fetch: users + profiles (LEFT JOIN)
    const { data: dbUser, error: dbError } = await supabase
      .from("users")
      .select("*, profiles(*)")
      .eq("id", internalUserId)
      .single();

    if (dbError || !dbUser) {
      logger.error(requestId, "Core identity not found", dbError);
      return formatErrorResponse("User not found", ApiErrorCode.NOT_FOUND, requestId, 404);
    }

    const dbProfile = dbUser.profiles || {}; // Handle missing profile row safely

    // 2. Map to standardized DTO
    const userDto = profileMapper.fromDb(dbUser, dbProfile);

    // 3. Get auxiliary data (travel preferences, counts)
    const { data: travelPrefs } = await supabase
      .from("travel_preferences")
      .select("*")
      .eq("user_id", internalUserId)
      .maybeSingle();

    const hasCompletedOnboarding = Boolean(dbUser.onboarding_completed ?? false);

    // 🚀 AUTO-REPAIR: If profile exists but flag is false, mark as complete.
    if (dbProfile.id && !hasCompletedOnboarding) {
      const { error: repairError } = await supabase
        .from("users")
        .update({ onboarding_completed: true })
        .eq("id", internalUserId);
      
      if (repairError) {
        logger.error(requestId, "Auto-repair onboarding failed", repairError);
      }
    }

    // 4. Fetch follower/following counts
    const { count: followersCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", internalUserId);

    const { count: followingCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", internalUserId);

    // ✅ Map to ProfileResponse (Final Contract)
    const profileData: ProfileResponse = {
      ...userDto,
      name: userDto.displayName, // Map DTO displayName to Contract name
      onboardingCompleted: hasCompletedOnboarding,
      followers: followersCount || 0,
      following: followingCount || 0,
      // Travel preferences (overrides DTO if found in separate table)
      destinations: travelPrefs?.destinations || userDto.destinations || [],
      tripFocus: travelPrefs?.trip_focus || userDto.tripFocus || [],
      travelFrequency: travelPrefs?.frequency || userDto.travelFrequency || "",
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


