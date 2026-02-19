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
import { createRouteHandlerSupabaseClient, createRouteHandlerSupabaseClientWithServiceRole } from "../../../lib/supabase";
import { getSetting } from "../../../lib/settings";
import { getMatchingPresetConfig } from "../../../lib/matching/config";
import * as Sentry from "@sentry/nextjs";

// Initialize Supabase client for this route
// Use service role key to bypass RLS for fetching user profiles
const supabase = createRouteHandlerSupabaseClientWithServiceRole();

// Helper: get interests from travel_preferences by Clerk user id (fallback)
const getTravelInterestsByClerkId = async (
  clerkUserId: string
): Promise<string[]> => {
  try {
    const supabase = createRouteHandlerSupabaseClientWithServiceRole();
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .maybeSingle();
    if (userErr || !userRow) {
      return [];
    }
    const { data: prefsRow, error: prefsErr } = await supabase
      .from("travel_preferences")
      .select("interests")
      .eq("user_id", userRow.id)
      .maybeSingle();
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

    // 2. Resolve internal User UUID for filtering
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .maybeSingle();

    let searchingUserUuid: string | null = null;
    let skipExclusionLists = false;

    if (userError || !userData) {
      console.warn("⚠️  Could not resolve internal UUID for user:", userId);
      console.warn("   Supabase error:", userError);
      console.warn("   This usually means:");
      console.warn("   1. User hasn't completed profile setup in Supabase");
      console.warn("   2. User doesn't exist in 'users' table");
      console.warn("   3. Clerk ID mismatch between session and database");
      console.warn("   ⚠️  Proceeding without exclusion list filtering (testing mode)");
      skipExclusionLists = true;
    } else {
      searchingUserUuid = userData.id;
      console.log(`🔍 Resolved Clerk ID ${userId} to database UUID: ${searchingUserUuid}`);
    }

    const currentDestination = searchingUserSession.destination.name;

    // 3. Fetch Exclusion Lists (Matches, Skips, Reports, Interests)
    // Skip if user doesn't exist in database (for testing/development)
    const excludedUuids = new Set<string>();
    
    if (!skipExclusionLists && searchingUserUuid) {
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
          .or(`user_a_id.eq.${searchingUserUuid},user_b_id.eq.${searchingUserUuid}`)
          .eq("destination_id", currentDestination),

        // 2. Skips: Exclude if I skipped them OR they skipped me for same destination
        supabase
          .from("match_skips")
          .select("user_id, skipped_user_id")
          .or(`user_id.eq.${searchingUserUuid},skipped_user_id.eq.${searchingUserUuid}`)
          .eq("destination_id", currentDestination)
          .eq("match_type", "solo"),

        // 3. Reports: Exclude GLOBALLY if I reported them OR they reported me
        supabase
          .from("user_flags")
          .select("reporter_id, user_id")
          .or(`reporter_id.eq.${searchingUserUuid},user_id.eq.${searchingUserUuid}`),

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
    }

    // Resolve Excluded Clerk IDs
    const excludedClerkIds = new Set<string>();
    excludedClerkIds.add(userId); // Exclude self

    if (!skipExclusionLists && excludedUuids.size > 0) {
      const { data: excludedUsers } = await supabase
        .from("users")
        .select("clerk_user_id")
        .in("id", Array.from(excludedUuids));

      excludedUsers?.forEach((u) => excludedClerkIds.add(u.clerk_user_id));
    }
    
    if (skipExclusionLists) {
      console.log(
        `⚠️  Skipping exclusion list filtering (user not in database)`
      );
    } else {
      console.log(
        `🚫 Filtering out ${excludedClerkIds.size - 1} users based on interaction history`
      );
    }

    // 4. Get all other active session keys and fetch their data
    const allSessionKeys = (await redisClient.keys("session:*")).filter(
      (key) => {
        const sessionUserId = key.replace("session:", "");
        const shouldExclude = sessionUserId === userId;
        if (shouldExclude) {
          console.log(`🚫 Excluding session key: ${key} (matches current user: ${userId})`);
        }
        return !shouldExclude;
      }
    );

    console.log(`📋 Total session keys found: ${(await redisClient.keys("session:*")).length}, after filtering: ${allSessionKeys.length}`);

    if (allSessionKeys.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    const allSessionsJSON = await redisClient.mGet(allSessionKeys);

    if (!allSessionsJSON || !Array.isArray(allSessionsJSON)) {
      return NextResponse.json([], { status: 200 });
    }

    // 5. Parse and Filter Matches - Map session keys with their data for proper matching
    const parsedSessions = allSessionKeys
      .map((sessionKey, index) => {
        const sessionJSON = allSessionsJSON[index];
        if (!sessionJSON) return null;
        
        try {
          const session = JSON.parse(sessionJSON) as SoloSession;
          // Extract userId from the session key for double-check
          const sessionKeyUserId = sessionKey.replace("session:", "");
          return { session, sessionKeyUserId };
        } catch (error) {
          console.error(`⚠️  Error parsing session JSON for key ${sessionKey}:`, error);
          return null;
        }
      })
      .filter((item): item is { session: SoloSession; sessionKeyUserId: string } => item !== null);

    // Resolve all match session Clerk IDs to database UUIDs for comparison
    const matchClerkIdsForExclusion = parsedSessions.map(({ session }) => session.userId).filter(Boolean);
    const matchUserUuidsMap = new Map<string, string>();
    
    if (matchClerkIdsForExclusion.length > 0) {
      const { data: matchUsers } = await supabase
        .from("users")
        .select("id, clerk_user_id")
        .in("clerk_user_id", matchClerkIdsForExclusion);
      
      matchUsers?.forEach((u) => {
        matchUserUuidsMap.set(u.clerk_user_id, u.id);
      });
    }

    // Now filter with all checks including database UUID comparison
    const allSessions: SoloSession[] = parsedSessions
      .filter(({ session, sessionKeyUserId }) => {
        // CRITICAL: Exclude self using multiple checks
        // Check 1: session.userId matches searching userId (Clerk ID comparison)
        if (session.userId && session.userId.trim() === userId.trim()) {
          console.log(`🚫 Excluding own profile (userId match): ${session.userId} === ${userId}`);
          return false;
        }
        // Check 2: session key userId matches searching userId (double-check)
        if (sessionKeyUserId && sessionKeyUserId.trim() === userId.trim()) {
          console.log(`🚫 Excluding own profile (key match): ${sessionKeyUserId} === ${userId}`);
          return false;
        }
        // Check 3: Resolve match session Clerk ID to database UUID and compare
        // This catches cases where different Clerk IDs point to the same user
        // Skip this check if searching user doesn't exist in database
        if (session.userId && searchingUserUuid) {
          const matchUserUuid = matchUserUuidsMap.get(session.userId.trim());
          if (matchUserUuid && matchUserUuid === searchingUserUuid) {
            console.log(`🚫 Excluding own profile (database UUID match): ${session.userId} resolves to same UUID ${searchingUserUuid}`);
            return false;
          }
        }
        // Check 4: Exclude if in excluded list
        if (session.userId && excludedClerkIds.has(session.userId.trim())) {
          console.log(`🚫 Excluding profile (excluded list): ${session.userId}`);
          return false;
        }
        return true;
      })
      .map(({ session }) => session);

    console.log(`✅ Found ${allSessions.length} valid candidates after filtering (excluded self and ${excludedClerkIds.size - 1} other users)`);

    // 3. Prepare all matches: fetch static_attributes and filter by compatibility
    console.log(`🔍 Preparing matches and fetching static_attributes...`);
    
    // OPTIMIZATION: Batch fetch all user UUIDs first (parallel)
    const matchClerkIdsForProfiles = allSessions.map(s => s.userId).filter(Boolean) as string[];
    const userUuidMap = new Map<string, string>();
    
    if (matchClerkIdsForProfiles.length > 0) {
      const { data: users } = await supabase
        .from("users")
        .select("id, clerk_user_id")
        .in("clerk_user_id", matchClerkIdsForProfiles);
      
      users?.forEach(u => {
        if (u.clerk_user_id) {
          userUuidMap.set(u.clerk_user_id, u.id);
        }
      });
    }
    
    // Also fetch searching user UUID if needed
    let searchingUserUuidForProfile: string | null = null;
    if (!searchingUserSession.static_attributes) {
      const { data: searchingUserData } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", searchingUserSession.userId)
        .maybeSingle();
      
      if (searchingUserData?.id) {
        searchingUserUuidForProfile = searchingUserData.id;
      }
    }
    
    // OPTIMIZATION: Batch fetch all profiles in parallel
    const profilePromises: Promise<{ userId: string; profile: any } | null>[] = [];
    
    // Fetch profiles for match sessions
    for (const matchSession of allSessions) {
      if (!matchSession.userId || matchSession.static_attributes) continue;
      
      const userUuid = userUuidMap.get(matchSession.userId);
      if (!userUuid) continue;
      
      profilePromises.push(
        (async () => {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("name, age, gender, personality, smoking, drinking, religion, job, languages, nationality, location, bio, interests, profile_photo")
            .eq("user_id", userUuid)
            .maybeSingle();
          
          if (error || !profile) return null;
          return { userId: matchSession.userId!, profile };
        })()
      );
    }
    
    // Fetch searching user profile if needed
    if (searchingUserUuidForProfile && !searchingUserSession.static_attributes && searchingUserSession.userId) {
      const searchingUserId = searchingUserSession.userId; // Store in const for type narrowing
      profilePromises.push(
        Promise.resolve().then(async () => {
          const { data: profile, error } = await supabase
            .from("profiles")
            .select("name, age, gender, personality, smoking, drinking, religion, job, languages, nationality, location, bio, interests, profile_photo")
            .eq("user_id", searchingUserUuidForProfile!)
            .maybeSingle();
          
          if (error || !profile) return null;
          return { userId: searchingUserId, profile };
        })
      );
    }
    
    // Wait for all profile fetches to complete
    const profileResults = await Promise.all(profilePromises);
    const profileMap = new Map<string, any>();
    
    profileResults.forEach(result => {
      if (result) {
        profileMap.set(result.userId, result.profile);
      }
    });
    
    // Apply profiles to sessions
    for (const matchSession of allSessions) {
      if (matchSession.userId && profileMap.has(matchSession.userId) && !matchSession.static_attributes) {
        const profile = profileMap.get(matchSession.userId);
        matchSession.static_attributes = {
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
          interests: Array.isArray(profile.interests) ? profile.interests : [],
          avatar: profile.profile_photo || undefined,
          language: "english",
        };
        console.log(`✅ Fetched static_attributes for ${matchSession.userId}: age=${profile.age}, interests=${profile.interests?.length || 0}, personality=${profile.personality || 'N/A'}`);
      }
    }
    
    // Apply searching user profile if needed
    if (searchingUserSession.userId && profileMap.has(searchingUserSession.userId) && !searchingUserSession.static_attributes) {
      const profile = profileMap.get(searchingUserSession.userId);
      searchingUserSession.static_attributes = {
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
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        avatar: profile.profile_photo || undefined,
        language: "english",
      };
      console.log(`✅ Fetched static_attributes for searching user ${searchingUserSession.userId}: age=${profile.age}, interests=${profile.interests?.length || 0}, personality=${profile.personality || 'N/A'}`);
    }
    
    // Filter by compatibility
    const preparedMatches: SoloSession[] = [];
    
    for (const matchSession of allSessions) {
      if (!matchSession.destination) {
        console.log(`⚠️  Skipping match: No destination for ${matchSession.userId}`);
        continue;
      }
      
      // Use enhanced compatibility check with preset maxDistanceKm
      const isCompatible = isCompatibleMatch(
        searchingUserSession,
        matchSession,
        presetConfig.maxDistanceKm
      );
      
      if (!isCompatible) {
        // Debug: Log why match was filtered
        console.log(`⚠️  Match filtered (incompatible): ${matchSession.userId}`);
        console.log(`   Searching: ${searchingUserSession.destination?.name || 'N/A'} (${searchingUserSession.startDate} to ${searchingUserSession.endDate})`);
        console.log(`   Match: ${matchSession.destination?.name || 'N/A'} (${matchSession.startDate} to ${matchSession.endDate})`);
        continue;
      }

      preparedMatches.push(matchSession);
    }

    console.log(`✅ Prepared ${preparedMatches.length} compatible matches for scoring`);

    // 4. Batch ML prediction for all prepared matches (PERFORMANCE OPTIMIZATION)
    const mlScoresMap = new Map<string, number | null>();
    if (preparedMatches.length > 0) {
      try {
        const { calculateMLCompatibilityScoresBatch } = await import("../../../lib/ai/matching/ml-scoring");
        const batchMLScores = await calculateMLCompatibilityScoresBatch(
          searchingUserSession,
          preparedMatches,
          { enabled: true, fallbackOnError: true }
        );
        mlScoresMap.clear();
        batchMLScores.forEach((score, userId) => mlScoresMap.set(userId, score));
        console.log(`✅ Batch ML prediction completed for ${mlScoresMap.size} matches`);
      } catch (error) {
        console.warn("⚠️  Batch ML prediction failed, will use individual predictions:", error);
      }
    }

    // 5. Score all prepared matches using batch ML results
    console.log(`🔍 Calculating final compatibility scores...`);
    const scoredMatches = (
      await Promise.all(
        preparedMatches.map(async (matchSession) => {
          if (!matchSession.destination) {
            console.log(`⚠️  Skipping match: No destination for ${matchSession.userId}`);
            return null;
          }

          // CRITICAL: Fetch static_attributes from Supabase if missing in session
          // ML model needs these to differentiate between matches
          if (!matchSession.static_attributes) {
            try {
              // First, get the user's internal UUID
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("id")
                .eq("clerk_user_id", matchSession.userId)
                .maybeSingle();

              if (userError || !userData) {
                console.warn(
                  `⚠️ Could not resolve user UUID for ${matchSession.userId} to fetch static_attributes:`,
                  userError?.message || "User not found"
                );
              } else {
                // Now fetch profile using the UUID
                const { data: profile, error: profileError } = await supabase
                  .from("profiles")
                  .select(
                    "name, age, gender, personality, smoking, drinking, religion, job, languages, nationality, location, bio, interests, profile_photo"
                  )
                  .eq("user_id", userData.id)
                  .maybeSingle();

                if (profileError || !profile) {
                  console.warn(
                    `⚠️ Could not fetch profile for ${matchSession.userId}:`,
                    profileError?.message || "Profile not found"
                  );
                } else if (profile) {
                  matchSession.static_attributes = {
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
                    language: "english",
                  };
                  console.log(`✅ Fetched static_attributes for ${matchSession.userId}: age=${profile.age}, interests=${profile.interests?.length || 0}, personality=${profile.personality || 'N/A'}`);
                }
              }
            } catch (error) {
              console.warn(
                `⚠️ Error fetching static_attributes for ${matchSession.userId}:`,
                error instanceof Error ? error.message : String(error)
              );
            }
          }

          // Also ensure searching user has static_attributes
          if (!searchingUserSession.static_attributes) {
            try {
              // First, get the user's internal UUID
              const { data: userData, error: userError } = await supabase
                .from("users")
                .select("id")
                .eq("clerk_user_id", searchingUserSession.userId)
                .maybeSingle();

              if (userError || !userData) {
                console.warn(
                  `⚠️ Could not resolve user UUID for searching user ${searchingUserSession.userId} to fetch static_attributes:`,
                  userError?.message || "User not found"
                );
              } else {
                // Now fetch profile using the UUID
                const { data: profile, error: profileError } = await supabase
                  .from("profiles")
                  .select(
                    "name, age, gender, personality, smoking, drinking, religion, job, languages, nationality, location, bio, interests, profile_photo"
                  )
                  .eq("user_id", userData.id)
                  .maybeSingle();

                if (profileError || !profile) {
                  console.warn(
                    `⚠️ Could not fetch profile for searching user ${searchingUserSession.userId}:`,
                    profileError?.message || "Profile not found"
                  );
                } else if (profile) {
                  searchingUserSession.static_attributes = {
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
                    language: "english",
                  };
                  console.log(`✅ Fetched static_attributes for searching user ${searchingUserSession.userId}: age=${profile.age}, interests=${profile.interests?.length || 0}, personality=${profile.personality || 'N/A'}`);
                }
              }
            } catch (error) {
              console.warn(
                `⚠️ Error fetching static_attributes for searching user ${searchingUserSession.userId}:`,
                error instanceof Error ? error.message : String(error)
              );
            }
          }
          
          // Use enhanced compatibility check with preset maxDistanceKm
          const isCompatible = isCompatibleMatch(
            searchingUserSession,
            matchSession,
            presetConfig.maxDistanceKm
          );
          
          if (!isCompatible) {
            // Debug: Log why match was filtered
            console.log(`⚠️  Match filtered (incompatible): ${matchSession.userId}`);
            console.log(`   Searching: ${searchingUserSession.destination?.name || 'N/A'} (${searchingUserSession.startDate} to ${searchingUserSession.endDate})`);
            console.log(`   Match: ${matchSession.destination?.name || 'N/A'} (${matchSession.startDate} to ${matchSession.endDate})`);
            return null;
          }

          // Use batch ML score if available, otherwise calculateFinalCompatibilityScore will fetch individually
          const batchMLScore = matchSession.userId ? mlScoresMap.get(matchSession.userId) ?? null : null;
          
          const { score, breakdown, budgetDifference, mlScore } =
            await calculateFinalCompatibilityScore(
              searchingUserSession,
              matchSession,
              undefined, // filterBoost
              true, // useML
              batchMLScore // providedMLScore from batch prediction
            );
          
          // Debug: Log score before threshold check
          if (score < presetConfig.minScore) {
            console.log(`⚠️  Match below threshold: ${matchSession.userId} - Score: ${score.toFixed(3)} < ${presetConfig.minScore}`);
            return null;
          }
          
          console.log(`✅ Match passed: ${matchSession.userId} - Score: ${score.toFixed(3)}`);

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
              // First get user UUID
              const { data: userData } = await supabase
                .from("users")
                .select("id")
                .eq("clerk_user_id", matchSession.userId)
                .maybeSingle();

              if (!userData?.id) {
                console.warn(`⚠️ Could not resolve user UUID for ${matchSession.userId} in fallback static_attributes fetch`);
              } else {
                const { data: profile } = await supabase
                  .from("profiles")
                  .select(
                    "name, age, gender, personality, smoking, drinking, religion, job, languages, nationality, location, bio, interests, profile_photo"
                  )
                  .eq("user_id", userData.id)
                  .maybeSingle();

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
            mlScore, // Include ML score for performance monitoring
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
