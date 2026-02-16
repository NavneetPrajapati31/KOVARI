// -----------------------------------------------------------------------------
//   File 4: API Endpoint for Getting Solo Matches (Optimized)
// -----------------------------------------------------------------------------
// Location: /app/api/match-solo/route.ts

import { NextRequest, NextResponse } from "next/server";
import {
  calculateFinalCompatibilityScore,
  isCompatibleMatch,
} from "../../../lib/matching/solo";
import { SoloSession } from "../../../types";
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

/** MVP: Single bulk fetch for profiles + interests (1 users query + 2 parallel fetches instead of 4 round-trips) */
const getBulkCandidateData = async (
  clerkIds: string[],
): Promise<{
  profiles: Record<string, any>;
  interests: Record<string, string[]>;
}> => {
  if (clerkIds.length === 0) return { profiles: {}, interests: {} };
  const supabase = createAdminSupabaseClient();
  const { data: users, error: userErr } = await supabase
    .from("users")
    .select("id, clerk_user_id")
    .in("clerk_user_id", clerkIds)
    .eq("isDeleted", false);
  if (userErr || !users?.length) return { profiles: {}, interests: {} };
  const uuidToClerk = new Map<string, string>();
  const uuids: string[] = [];
  users.forEach((u) => {
    uuidToClerk.set(u.id, u.clerk_user_id);
    uuids.push(u.id);
  });
  const [profilesRes, prefsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "user_id, name, age, gender, personality, smoking, drinking, religion, job, languages, nationality, location, location_details, food_preference, bio, interests, profile_photo",
      )
      .in("user_id", uuids),
    supabase
      .from("travel_preferences")
      .select("user_id, interests")
      .in("user_id", uuids),
  ]);
  const profiles: Record<string, any> = {};
  (profilesRes.data || []).forEach((p) => {
    const clerkId = uuidToClerk.get(p.user_id);
    if (clerkId) {
      const locDetails = p.location_details as {
        city?: string;
        formatted_address?: string;
        latitude?: number;
        longitude?: number;
      } | null;
      const locationCoords =
        locDetails?.latitude != null && locDetails?.longitude != null
          ? { lat: locDetails.latitude, lon: locDetails.longitude }
          : typeof p.location === "object" && p.location?.lat != null
            ? {
                lat: (p.location as { lat: number; lon: number }).lat,
                lon: (p.location as { lat: number; lon: number }).lon,
              }
            : { lat: 0, lon: 0 };
      const locationDisplay =
        locDetails?.city ||
        (typeof locDetails?.formatted_address === "string"
          ? locDetails.formatted_address.split(",")[0]?.trim()
          : null) ||
        (typeof p.location === "string" ? p.location : null);

      profiles[clerkId] = {
        name: p.name,
        age: p.age,
        gender: p.gender,
        personality: p.personality,
        smoking: p.smoking,
        drinking: p.drinking,
        religion: p.religion,
        profession: p.job,
        languages: p.languages,
        nationality: p.nationality,
        location: locationCoords,
        locationDisplay: locationDisplay || undefined,
        foodPreference: p.food_preference || undefined,
        bio: p.bio,
        interests: Array.isArray(p.interests) ? p.interests : [],
        avatar: p.profile_photo || undefined,
        language: "english",
      };
    }
  });
  const interests: Record<string, string[]> = {};
  (prefsRes.data || []).forEach((p) => {
    const clerkId = uuidToClerk.get(p.user_id);
    if (clerkId)
      interests[clerkId] = Array.isArray(p.interests)
        ? (p.interests as string[])
        : [];
  });
  return { profiles, interests };
};

const computeCommonInterests = (a?: string[], b?: string[]): string[] => {
  const norm = (arr?: string[]) =>
    (arr || []).map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  const aNorm = norm(a);
  const bNorm = norm(b);
  if (aNorm.length === 0 || bNorm.length === 0) return [];
  const bSet = new Set(bNorm);
  return Array.from(new Set(aNorm.filter((x) => bSet.has(x))));
};

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Parallel: maintenance + preset (MVP optimization)
    const [maintenance, presetSetting] = await Promise.all([
      getSetting("maintenance_mode"),
      getSetting("matching_preset"),
    ]);
    if (maintenance && (maintenance as { enabled: boolean }).enabled) {
      return NextResponse.json(
        { error: "System under maintenance. Please try later." },
        { status: 503 },
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Parse filter parameters
    const ageMin = searchParams.get("ageMin")
      ? parseInt(searchParams.get("ageMin")!)
      : 18;
    const ageMax = searchParams.get("ageMax")
      ? parseInt(searchParams.get("ageMax")!)
      : 100;
    const gender = searchParams.get("gender") || "Any";
    const personality = searchParams.get("personality") || "Any";
    const smokingPref = searchParams.get("smoking") || "Any";
    const drinkingPref = searchParams.get("drinking") || "Any";
    const nationality = searchParams.get("nationality") || "Any";
    const languagesFilter =
      searchParams.get("languages")?.split(",").filter(Boolean) || [];
    // const interestsFilter = searchParams.get("interests")?.split(",").filter(Boolean) || [];

    console.log(`🔍 Match-solo request for userId: ${userId} with filters:`, {
      age: `${ageMin}-${ageMax}`,
      gender,
      personality,
      smoking: smokingPref,
      drinking: drinkingPref,
      nationality,
      languages: languagesFilter.length,
    });

    if (!userId) {
      return NextResponse.json(
        { message: "User ID is required" },
        { status: 400 },
      );
    }
    if (userId !== clerkUserId) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const presetMode =
      (presetSetting as { mode: string } | null)?.mode || "balanced";
    const presetConfig = getMatchingPresetConfig(presetMode);

    console.log(
      `📊 Using matching preset: ${presetMode} (minScore: ${presetConfig.minScore}, maxDistance: ${presetConfig.maxDistanceKm}km)`,
    );

    // 1. Get the searching user's session from Redis
    const redisClient = await ensureRedisConnection();
    const searchingUserSessionJSON = await redisClient.get(`session:${userId}`);
    if (!searchingUserSessionJSON) {
      return NextResponse.json(
        {
          message:
            "Active session for user not found. Please start a new search.",
        },
        { status: 404 },
      );
    }

    const searchingUserSession: SoloSession = JSON.parse(
      searchingUserSessionJSON,
    );

    if (!searchingUserSession.destination) {
      return NextResponse.json(
        {
          message:
            "Your session data is incomplete. Please start a new search.",
        },
        { status: 400 },
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
      return NextResponse.json(
        { message: "User profile not found" },
        { status: 404 },
      );
    }
    const searchingUserUuid = userData.id;
    const currentDestination = searchingUserSession.destination.name;

    // 3. Fetch Exclusion Lists & Sessions in Parallel
    console.log("🔍 Fetching exclusion lists and candidate sessions...");

    const MAX_SESSIONS_FETCH = 500; // MVP: cap Redis scan for fast response
    const fetchAllSessions = async () => {
      const keys = await redisClient.keys("session:*");
      const filteredKeys = keys
        .filter((k) => k !== `session:${userId}`)
        .slice(0, MAX_SESSIONS_FETCH);
      if (filteredKeys.length === 0) return [];

      // Batch MGET to avoid blocking if keys are many
      const chunks = [];
      const chunkSize = 500;
      for (let i = 0; i < filteredKeys.length; i += chunkSize) {
        chunks.push(filteredKeys.slice(i, i + chunkSize));
      }

      const sessionChunks = await Promise.all(
        chunks.map((chunk) => redisClient.mGet(chunk)),
      );

      return sessionChunks
        .flat()
        .filter((s): s is string => s !== null)
        .map((s) => JSON.parse(s));
    };

    const [
      matchesResult,
      skipsResult,
      reportsResult,
      interestsSentResult,
      interestsReceivedResult,
      allSessions,
    ] = await Promise.all([
      supabase
        .from("matches")
        .select("user_a_id, user_b_id")
        .or(
          `user_a_id.eq.${searchingUserUuid},user_b_id.eq.${searchingUserUuid}`,
        )
        .eq("destination_id", currentDestination),
      supabase
        .from("match_skips")
        .select("user_id, skipped_user_id")
        .or(
          `user_id.eq.${searchingUserUuid},skipped_user_id.eq.${searchingUserUuid}`,
        )
        .eq("destination_id", currentDestination)
        .eq("match_type", "solo"),
      supabase
        .from("user_flags")
        .select("reporter_id, user_id")
        .or(
          `reporter_id.eq.${searchingUserUuid},user_id.eq.${searchingUserUuid}`,
        ),
      supabase
        .from("match_interests")
        .select("to_user_id")
        .eq("from_user_id", searchingUserUuid)
        .eq("destination_id", currentDestination)
        .eq("status", "pending"),
      supabase
        .from("match_interests")
        .select("from_user_id")
        .eq("to_user_id", searchingUserUuid)
        .eq("destination_id", currentDestination)
        .in("status", ["pending", "declined"]),
      fetchAllSessions(),
    ]);

    // Build Set of Excluded Internal UUIDs
    const excludedUuids = new Set<string>();
    matchesResult.data?.forEach((m) => {
      excludedUuids.add(m.user_a_id);
      excludedUuids.add(m.user_b_id);
    });
    skipsResult.data?.forEach((s) => {
      excludedUuids.add(s.user_id);
      excludedUuids.add(s.skipped_user_id);
    });
    reportsResult.data?.forEach((r) => {
      excludedUuids.add(r.reporter_id);
      excludedUuids.add(r.user_id);
    });
    interestsSentResult.data?.forEach((i) => excludedUuids.add(i.to_user_id));
    interestsReceivedResult.data?.forEach((i) =>
      excludedUuids.add(i.from_user_id),
    );
    // Exclude self
    excludedUuids.add(searchingUserUuid);

    // Identify Valid Candidates
    const candidates = (allSessions as SoloSession[]).filter((s) => s.userId);

    if (candidates.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // Resolve UUIDs for Filtered Candidates to check against Exclusion List
    // We need to fetch internal IDs for ALL candidates to filter them by exclusion list
    // Optimization: Only fetch IDs/ClerkIDs for candidates
    const candidateClerkIds = candidates.map((s) => s.userId!);

    // Batch fetch candidate UUIDs
    const { data: candidateUsers } = await supabase
      .from("users")
      .select("id, clerk_user_id")
      .in("clerk_user_id", candidateClerkIds)
      .eq("isDeleted", false);

    const validCandidateClerkIds = new Set<string>();
    const clerkToUuidMap = new Map<string, string>(); // Map ClerkID -> UUID

    candidateUsers?.forEach((u) => {
      if (!excludedUuids.has(u.id)) {
        validCandidateClerkIds.add(u.clerk_user_id);
        clerkToUuidMap.set(u.clerk_user_id, u.id);
      }
    });

    const activeCandidates = candidates.filter(
      (s) => s.userId && validCandidateClerkIds.has(s.userId),
    );

    console.log(
      `✅ Found ${activeCandidates.length} valid candidates after exclusions`,
    );

    // 4. Bulk Fetch Profiles + Interests (MVP: single consolidated query)
    const clerkIdsNeedingData = [
      ...new Set([
        ...activeCandidates
          .filter((s) => !s.static_attributes)
          .map((s) => s.userId!),
        ...activeCandidates
          .filter(
            (s) =>
              !s.static_attributes?.interests ||
              s.static_attributes.interests.length === 0,
          )
          .map((s) => s.userId!),
        searchingUserSession.userId!,
      ]),
    ].filter(Boolean);
    const { profiles: bulkProfiles, interests: bulkInterests } =
      await getBulkCandidateData(clerkIdsNeedingData);

    const searchingInterests =
      searchingUserSession.static_attributes?.interests ||
      searchingUserSession.interests ||
      bulkInterests[searchingUserSession.userId!] ||
      [];

    // 5. Score and Filter (In-Memory)

    const scoredMatches = activeCandidates
      .map((matchSession) => {
        const clerkId = matchSession.userId!;

        // Merge Profile Data
        let staticAttributes = matchSession.static_attributes;
        if (!staticAttributes && bulkProfiles[clerkId]) {
          staticAttributes = bulkProfiles[clerkId];
        }

        // Merge Interests
        let interests =
          staticAttributes?.interests || matchSession.interests || [];
        if ((!interests || interests.length === 0) && bulkInterests[clerkId]) {
          interests = bulkInterests[clerkId];
        }

        // Apply to staticAttributes for filtering
        if (staticAttributes) {
          staticAttributes.interests = interests;
        }

        if (!matchSession.destination) return null;

        // A. Distance Filter
        if (
          !isCompatibleMatch(
            searchingUserSession,
            matchSession,
            presetConfig.maxDistanceKm,
          )
        ) {
          return null;
        }

        // B. Attribute Filters
        if (staticAttributes) {
          const {
            age,
            gender: g,
            personality: p,
            smoking,
            drinking,
            nationality: n,
          } = staticAttributes;

          if (age && (age < ageMin || age > ageMax)) return null;
          if (gender !== "Any" && g && g.toLowerCase() !== gender.toLowerCase())
            return null;
          if (
            personality !== "Any" &&
            p &&
            p.toLowerCase() !== personality.toLowerCase()
          )
            return null;

          // Smoking: If "No" (Strictly Non), exclude 'yes', 'occasionally'
          if (smokingPref === "No" && smoking) {
            if (
              ["yes", "occasionally", "socially"].includes(
                smoking.toLowerCase(),
              )
            )
              return null;
          }
          // Drinking: If "No" (Strictly Non), exclude 'yes', 'socially'
          if (drinkingPref === "No" && drinking) {
            if (
              ["yes", "occasionally", "socially"].includes(
                drinking.toLowerCase(),
              )
            )
              return null;
          }

          if (
            nationality !== "Any" &&
            n &&
            n.toLowerCase() !== nationality.toLowerCase()
          )
            return null;

          // Languages
          if (languagesFilter.length > 0) {
            const userLangs = (staticAttributes.languages || [])
              .concat(
                staticAttributes.language ? [staticAttributes.language] : [],
              )
              .map((l) => l.toLowerCase());
            const hasCommon = languagesFilter.some((l) =>
              userLangs.includes(l.toLowerCase()),
            );
            if (!hasCommon) return null;
          }
        }

        // C. Scoring
        const { score, breakdown, budgetDifference } =
          calculateFinalCompatibilityScore(searchingUserSession, matchSession);

        if (score < presetConfig.minScore) {
          return null;
        }

        const commonInterests = computeCommonInterests(
          searchingInterests,
          interests,
        );

        return {
          user: {
            userId: matchSession.userId,
            budget: matchSession.budget,
            full_name: staticAttributes?.name,
            ...staticAttributes,
            interests,
          },
          score,
          destination: matchSession.destination.name,
          breakdown,
          budgetDifference,
          commonInterests,
        };
      })
      .filter((m) => m !== null);

    // 6. Sort and Return Top Matches
    const sortedMatches = scoredMatches
      .sort((a, b) => b!.score - a!.score)
      .slice(0, 10);

    console.log(`✅ Returning ${sortedMatches.length} top matches`);

    // 7. Impression Tracking (Fire & Forget, Bulk Optimized)
    if (sortedMatches.length > 0) {
      const destinationName = searchingUserSession.destination?.name || null;
      (async () => {
        try {
          const newImpressions = [];
          const timestamp = new Date().toISOString();

          for (const match of sortedMatches) {
            if (!match?.user?.userId) continue;
            // Get internal UUID for the viewed user
            const viewedId = clerkToUuidMap.get(match.user.userId);
            if (viewedId) {
              newImpressions.push({
                viewer_id: searchingUserUuid,
                viewed_user_id: viewedId,
                destination_id: destinationName,
                created_at: timestamp,
              });
            }
          }

          if (newImpressions.length > 0) {
            const { error } = await supabaseAdmin
              .from("profile_impressions")
              .insert(newImpressions);

            if (error) {
              console.warn("Impression tracking error:", error);
            } else {
              // Metrics
              const redis = await ensureRedisConnection();
              await redis.incr("metrics:matches:daily");
            }
          }
        } catch (e) {
          console.warn("Background tracking error:", e);
        }
      })();
    }

    return NextResponse.json(sortedMatches, { status: 200 });
  } catch (error) {
    Sentry.captureException(error, {
      tags: {
        scope: "match-api",
        route: "GET /api/match-solo",
      },
    });
    console.error("Error in /api/match-solo:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
