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
import { getSetting } from "../../../lib/settings";
import { getMatchingPresetConfig } from "../../../lib/matching/config";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";

// Initialize Supabase client for this route
const supabase = createAdminSupabaseClient();

// Admin client for impression tracking (needs service role for writes)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// Helper: get interests from travel_preferences by Clerk user id (fallback)
const getTravelInterestsByClerkId = async (
  clerkUserId: string
): Promise<string[]> => {
  try {
    const supabase = createAdminSupabaseClient();
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .eq("isDeleted", false)
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
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

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
    if (userId !== clerkUserId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
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

    // 2. Resolve internal User UUID for filtering
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .eq("isDeleted", false)
      .single();

    if (userError || !userData) {
      console.error("❌ Could not resolve internal UUID for user:", userId);
      return NextResponse.json(
        { message: "User profile not found" },
        { status: 404 }
      );
    }
    const searchingUserUuid = userData.id;
    const currentDestination = searchingUserSession.destination.name;

    // 3. Fetch Exclusion Lists (Matches, Skips, Reports, Interests)
    console.log("🔍 Fetching exclusion lists...");
    const [
      matchesResult,
      skipsResult,
      reportsResult,
      interestsSentResult,
      interestsReceivedResult,
    ] = await Promise.all([
      // 1. Matches: Exclude if already matched for same destination
      supabase
        .from("matches")
        .select("user_a_id, user_b_id")
        .or(
          `user_a_id.eq.${searchingUserUuid},user_b_id.eq.${searchingUserUuid}`
        )
        .eq("destination_id", currentDestination),

      // 2. Skips: Exclude if I skipped them OR they skipped me for same destination
      supabase
        .from("match_skips")
        .select("user_id, skipped_user_id")
        .or(
          `user_id.eq.${searchingUserUuid},skipped_user_id.eq.${searchingUserUuid}`
        )
        .eq("destination_id", currentDestination)
        .eq("match_type", "solo"),

      // 3. Reports: Exclude GLOBALLY if I reported them OR they reported me
      supabase
        .from("user_flags")
        .select("reporter_id, user_id")
        .or(
          `reporter_id.eq.${searchingUserUuid},user_id.eq.${searchingUserUuid}`
        ),

      // 4. Pending Interests Sent: Exclude if I already sent pending interest
      supabase
        .from("match_interests")
        .select("to_user_id")
        .eq("from_user_id", searchingUserUuid)
        .eq("destination_id", currentDestination)
        .eq("status", "pending"),

      // 5. Pending/Declined Interests Received: Exclude if they sent pending or I declined
      supabase
        .from("match_interests")
        .select("from_user_id")
        .eq("to_user_id", searchingUserUuid)
        .eq("destination_id", currentDestination)
        .in("status", ["pending", "declined"]),
    ]);

    // Build Set of Excluded UUIDs
    const excludedUuids = new Set<string>();

    // Add Matches
    matchesResult.data?.forEach((m) => {
      if (m.user_a_id !== searchingUserUuid) excludedUuids.add(m.user_a_id);
      if (m.user_b_id !== searchingUserUuid) excludedUuids.add(m.user_b_id);
    });

    // Add Skips
    skipsResult.data?.forEach((s) => {
      if (s.user_id !== searchingUserUuid) excludedUuids.add(s.user_id);
      if (s.skipped_user_id !== searchingUserUuid)
        excludedUuids.add(s.skipped_user_id);
    });

    // Add Reports
    reportsResult.data?.forEach((r) => {
      if (r.reporter_id !== searchingUserUuid) excludedUuids.add(r.reporter_id);
      if (r.user_id !== searchingUserUuid) excludedUuids.add(r.user_id);
    });

    // Add Interests
    interestsSentResult.data?.forEach((i) => excludedUuids.add(i.to_user_id));
    interestsReceivedResult.data?.forEach((i) =>
      excludedUuids.add(i.from_user_id)
    );

    // Resolve Excluded Clerk IDs
    const excludedClerkIds = new Set<string>();
    excludedClerkIds.add(userId); // Exclude self

    if (excludedUuids.size > 0) {
      const { data: excludedUsers } = await supabase
        .from("users")
        .select("clerk_user_id")
        .in("id", Array.from(excludedUuids));

      excludedUsers?.forEach((u) => excludedClerkIds.add(u.clerk_user_id));
    }
    console.log(
      `🚫 Filtering out ${excludedClerkIds.size - 1} users based on interaction history`
    );

    // 4. Get all other active session keys and fetch their data
    const allSessionKeys = (await redisClient.keys("session:*")).filter(
      (key) => key !== `session:${userId}`
    );

    if (allSessionKeys.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const allSessionsJSON = await redisClient.mGet(allSessionKeys);

    if (!allSessionsJSON || !Array.isArray(allSessionsJSON)) {
      return NextResponse.json([], { status: 200 });
    }

    const validSessionsJSON = allSessionsJSON.filter(
      (s): s is string => s !== null
    );

    // 5. Parse and Filter Matches
    const allSessions: SoloSession[] = validSessionsJSON
      .map((s: string) => JSON.parse(s))
      .filter((session: SoloSession) => {
        // Exclude if in excluded list
        if (session.userId && excludedClerkIds.has(session.userId)) {
          return false;
        }
        return true;
      });

    // Exclude candidates whose accounts have been soft-deleted.
    // This prevents deleted users from appearing in matching even if they still
    // have stale Redis sessions.
    try {
      const candidateClerkIds = Array.from(
        new Set(allSessions.map((s) => s.userId).filter(Boolean))
      ) as string[];
      if (candidateClerkIds.length > 0) {
        const { data: deletedUsers } = await supabaseAdmin
          .from("users")
          .select("clerk_user_id")
          .in("clerk_user_id", candidateClerkIds)
          .eq("isDeleted", true);
        deletedUsers?.forEach((u: any) => excludedClerkIds.add(u.clerk_user_id));
      }
    } catch (e) {
      console.warn("Failed to filter soft-deleted candidates:", e);
    }

    const filteredSessions = allSessions.filter((session) => {
      if (session.userId && excludedClerkIds.has(session.userId)) return false;
      return true;
    });

    console.log(
      `✅ Found ${filteredSessions.length} valid candidates after filtering`
    );

    // 3. Score all sessions and perform filtering with enhanced compatibility check
    console.log(`🔍 Calculating compatibility scores...`);
    const scoredMatches = (
      await Promise.all(
        filteredSessions.map(async (matchSession) => {
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
              const { data: matchUserRow } = await supabase
                .from("users")
                .select("id")
                .eq("clerk_user_id", matchSession.userId)
                .eq("isDeleted", false)
                .maybeSingle();
              if (!matchUserRow?.id) {
                return null;
              }

              const { data: profile } = await supabase
                .from("profiles")
                .select(
                  "name, age, gender, personality, smoking, drinking, religion, job, languages, nationality, location, bio, interests, profile_photo"
                )
                .eq("user_id", matchUserRow.id)
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

    // Track profile impressions for each matched user (async, don't block response)
    if (topMatches.length > 0 && searchingUserUuid) {
      const destinationName = searchingUserSession.destination?.name || null;

      // Track impressions asynchronously using admin client for proper permissions
      Promise.all(
        topMatches.map(async (match) => {
          if (
            match?.user?.userId &&
            match.user.userId !== searchingUserSession.userId
          ) {
            try {
              // Get the viewed user's UUID from their Clerk ID using admin client
              const { data: viewedUserData, error: userError } =
                await supabaseAdmin
                  .from("users")
                  .select("id")
                  .eq("clerk_user_id", match.user.userId)
                  .eq("isDeleted", false)
                  .maybeSingle();

              if (userError) {
                console.warn(
                  `Error fetching user ${match.user.userId} for impression tracking:`,
                  userError
                );
                return;
              }

              if (viewedUserData?.id) {
                // Check for duplicate impression today (within same day)
                const todayStart = new Date();
                todayStart.setHours(0, 0, 0, 0);
                const todayEnd = new Date();
                todayEnd.setHours(23, 59, 59, 999);

                const { data: existingImpression, error: checkError } =
                  await supabaseAdmin
                    .from("profile_impressions")
                    .select("id")
                    .eq("viewer_id", searchingUserUuid)
                    .eq("viewed_user_id", viewedUserData.id)
                    .eq("destination_id", destinationName || null)
                    .gte("created_at", todayStart.toISOString())
                    .lte("created_at", todayEnd.toISOString())
                    .maybeSingle();

                if (checkError) {
                  console.warn(
                    `Error checking existing impression:`,
                    checkError
                  );
                  return;
                }

                if (!existingImpression) {
                  // Insert new impression using admin client
                  const { error: insertError } = await supabaseAdmin
                    .from("profile_impressions")
                    .insert([
                      {
                        viewer_id: searchingUserUuid,
                        viewed_user_id: viewedUserData.id,
                        destination_id: destinationName || null,
                        created_at: new Date().toISOString(),
                      },
                    ]);

                  if (insertError) {
                    console.error(
                      `Failed to track impression for user ${viewedUserData.id}:`,
                      insertError
                    );
                    Sentry.captureException(insertError, {
                      tags: {
                        scope: "impression-tracking",
                        viewer_id: searchingUserUuid,
                        viewed_user_id: viewedUserData.id,
                      },
                    });
                  } else {
                    console.log(
                      `✅ Tracked impression: ${searchingUserUuid} viewed ${viewedUserData.id}`
                    );
                  }
                } else {
                  console.log(
                    `ℹ️ Impression already tracked today for ${viewedUserData.id}`
                  );
                }
              }
            } catch (err) {
              console.error(
                `Error tracking impression for match ${match?.user?.userId}:`,
                err
              );
              Sentry.captureException(err, {
                tags: {
                  scope: "impression-tracking",
                },
              });
            }
          }
        })
      ).catch((err) => {
        console.error("Error in impression tracking batch:", err);
        Sentry.captureException(err, {
          tags: {
            scope: "impression-tracking-batch",
          },
        });
      });
    }

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
