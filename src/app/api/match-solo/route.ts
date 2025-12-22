// -----------------------------------------------------------------------------
//   File 4: API Endpoint for Getting Solo Matches (FIXED for App Router)
// -----------------------------------------------------------------------------
// Location: /app/api/match-solo/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  calculateFinalCompatibilityScore,
  isCompatibleMatch,
} from "../../../lib/matching/solo";
import { SoloSession } from "../../../types";
// FIX: Add missing import for redis client
import redis, { ensureRedisConnection } from "../../../lib/redis";
import { createRouteHandlerSupabaseClient } from "../../../lib/supabase";
import { getSetting } from "../../../lib/settings";
import { getMatchingPresetConfig } from "../../../lib/matching/config";
import * as Sentry from "@sentry/nextjs";

// Initialize Supabase client for this route
const supabase = createRouteHandlerSupabaseClient();

// Helper: get interests from travel_preferences by Clerk user id (fallback)
const getTravelInterestsByClerkId = async (
  clerkUserId: string
): Promise<string[]> => {
  try {
    const supabase = createRouteHandlerSupabaseClient();
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();
    if (userErr || !userRow) {
      return [];
    }
    const { data: prefsRow, error: prefsErr } = await supabase
      .from("travel_preferences")
      .select("interests")
      .eq("user_id", userRow.id)
      .single();
    if (prefsErr || !prefsRow) {
      return [];
    }
    return Array.isArray(prefsRow.interests)
      ? (prefsRow.interests as string[])
      : [];
  } catch {
    return [];
  }
};

const computeCommonInterests = (a?: string[], b?: string[]): string[] => {
  const norm = (arr?: string[]) =>
    (arr || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  const aNorm = norm(a);
  const bNorm = norm(b);
  if (aNorm.length === 0 || bNorm.length === 0) return [];
  const bSet = new Set(bNorm);
  const common = Array.from(new Set(aNorm.filter((x) => bSet.has(x))));
  return common;
};

export async function GET(request: NextRequest) {
  try {
    // Check maintenance mode
    const maintenance = await getSetting("maintenance_mode");
    if (maintenance && (maintenance as { enabled: boolean }).enabled) {
      return NextResponse.json(
        { error: "System under maintenance. Please try later." },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    console.log(`🔍 Match-solo request for userId: ${userId}`);

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 }
      );
    }

    // Get matching preset configuration
    const presetSetting = await getSetting("matching_preset");
    const presetMode =
      (presetSetting as { mode: string } | null)?.mode || "balanced";
    const presetConfig = getMatchingPresetConfig(presetMode);
    console.log(
      `📊 Using matching preset: ${presetMode} (minScore: ${presetConfig.minScore}, maxDistance: ${presetConfig.maxDistanceKm}km)`
    );

    // 1. Get the searching user's session from Redis
    console.log(`🔍 Getting session for user: ${userId}`);
    const redisClient = await ensureRedisConnection();
    const searchingUserSessionJSON = await redisClient.get(`session:${userId}`);
    if (!searchingUserSessionJSON) {
      console.log(`❌ No session found for user: ${userId}`);
      return NextResponse.json(
        {
          message:
            "Active session for user not found. Please start a new search.",
        },
        { status: 404 }
      );
    }

    console.log(`✅ Session found for user: ${userId}`);
    const searchingUserSession: SoloSession = JSON.parse(
      searchingUserSessionJSON
    );

    // Edge Case: Ensure the searching user's own session data is valid before proceeding
    if (!searchingUserSession.destination) {
      console.log(`❌ Invalid session data for user: ${userId}`);
      return NextResponse.json(
        {
          message:
            "Your session data is incomplete. Please start a new search.",
        },
        { status: 400 }
      );
    }

    // 2. Get all other active session keys and fetch their data
    console.log(`🔍 Getting all session keys...`);
    const allSessionKeys = (await redisClient.keys("session:*")).filter(
      (key) => key !== `session:${userId}`
    );
    console.log(`✅ Found ${allSessionKeys.length} other sessions`);

    if (allSessionKeys.length === 0) {
      console.log(`ℹ️ No other sessions found`);
      return NextResponse.json([], { status: 200 });
    }

    console.log(
      `🔍 Getting session data for ${allSessionKeys.length} sessions...`
    );
    const allSessionsJSON = await redisClient.mGet(allSessionKeys);

    // FIX: Check if allSessionsJSON is not null and is an array before proceeding.
    if (!allSessionsJSON || !Array.isArray(allSessionsJSON)) {
      console.log(`❌ Invalid session data returned from Redis`);
      return NextResponse.json([], { status: 200 }); // Return empty if no valid sessions found
    }

    // FIX: Use a type predicate `s is string` in the filter to correctly inform
    // TypeScript that the resulting array only contains strings. This resolves all
    // subsequent type errors in the chain.
    const validSessionsJSON = allSessionsJSON.filter(
      (s): s is string => s !== null
    );
    console.log(`✅ Found ${validSessionsJSON.length} valid sessions`);

    const allSessions: SoloSession[] = validSessionsJSON.map((s: string) =>
      JSON.parse(s)
    );

    // 3. Score all sessions and perform filtering with enhanced compatibility check
    console.log(`🔍 Calculating compatibility scores...`);
    const scoredMatches = (
      await Promise.all(
        allSessions.map(async (matchSession) => {
          if (!matchSession.destination) {
            return null;
          }
          // Use enhanced compatibility check with preset maxDistanceKm
          if (
            !isCompatibleMatch(
              searchingUserSession,
              matchSession,
              presetConfig.maxDistanceKm
            )
          ) {
            return null;
          }

          const { score, breakdown, budgetDifference } =
            calculateFinalCompatibilityScore(
              searchingUserSession,
              matchSession
            );
          // Apply preset minScore threshold
          if (score < presetConfig.minScore) {
            return null;
          }

          // Compute common interests (fallback to travel_preferences if not in session)
          const searchingInterests =
            searchingUserSession.static_attributes?.interests;
          const matchInterests = matchSession.static_attributes?.interests;
          const resolvedSearchingInterests =
            searchingInterests && searchingInterests.length > 0
              ? searchingInterests
              : searchingUserSession.userId
                ? await getTravelInterestsByClerkId(searchingUserSession.userId)
                : [];
          const resolvedMatchInterests =
            matchInterests && matchInterests.length > 0
              ? matchInterests
              : matchSession.userId
                ? await getTravelInterestsByClerkId(matchSession.userId)
                : [];
          const commonInterests = computeCommonInterests(
            resolvedSearchingInterests,
            resolvedMatchInterests
          );

          // Get static attributes from Supabase if not in Redis session
          let staticAttributes = matchSession.static_attributes;
          if (!staticAttributes) {
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select(
                  "name, age, gender, personality, smoking, drinking, religion, job, languages, nationality, location, bio, interests, profile_photo"
                )
                .eq(
                  "user_id",
                  (
                    await supabase
                      .from("users")
                      .select("id")
                      .eq("clerk_user_id", matchSession.userId)
                      .single()
                  ).data?.id
                )
                .single();

              if (profile) {
                staticAttributes = {
                  name: profile.name,
                  age: profile.age,
                  gender: profile.gender,
                  personality: profile.personality,
                  smoking: profile.smoking,
                  drinking: profile.drinking,
                  religion: profile.religion,
                  profession: profile.job,
                  languages: profile.languages,
                  nationality: profile.nationality,
                  location: profile.location || { lat: 0, lon: 0 },
                  bio: profile.bio,
                  interests: Array.isArray(profile.interests)
                    ? profile.interests
                    : [],
                  avatar: profile.profile_photo || undefined,
                  language: "english", // Default language
                };
              }
            } catch (error) {
              console.log(
                `⚠️ Could not fetch profile for ${matchSession.userId}:`,
                error
              );
            }
          }

          return {
            user: {
              userId: matchSession.userId,
              budget: matchSession.budget,
              full_name: staticAttributes?.name,
              ...staticAttributes,
            },
            score,
            destination: matchSession.destination.name,
            breakdown,
            budgetDifference,
            commonInterests,
          };
        })
      )
    ).filter((match) => match !== null);

    // 4. Sort by score and return top 10
    console.log(`✅ Found ${scoredMatches.length} compatible matches`);
    const sortedMatches = scoredMatches.sort((a, b) => b!.score - a!.score);
    const topMatches = sortedMatches.slice(0, 10);

    // Increment match generation counter for metrics
    if (topMatches.length > 0) {
      try {
        await redisClient.incr("metrics:matches:daily");
        await redisClient.expire("metrics:matches:daily", 86400); // 24 hours TTL
      } catch (e) {
        console.warn("Failed to increment match counter:", e);
        // Don't fail the request if metrics tracking fails
      }
    }

    console.log(`✅ Returning ${topMatches.length} top matches`);
    return NextResponse.json(topMatches, { status: 200 });
  } catch (error) {
    // Capture error in Sentry for alerting
    Sentry.captureException(error, {
      tags: {
        scope: "match-api",
        route: "GET /api/match-solo",
      },
    });
    console.error("Error in /api/match-solo:", error);
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace"
    );
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
