import { NextRequest, NextResponse } from "next/server";
import { Matching, AI } from "@kovari/api";
import { SoloSession } from "@kovari/types";
import { ensureRedisConnection } from "@kovari/api";
import { createRouteHandlerSupabaseClientWithServiceRole } from "@kovari/api";
import { getSetting } from "@kovari/utils";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@clerk/nextjs/server";

const { calculateFinalCompatibilityScore, isCompatibleMatch, getMatchingPresetConfig } = Matching;

const supabase = createRouteHandlerSupabaseClientWithServiceRole();

/** MVP: Single bulk fetch for profiles + interests */
const getBulkCandidateData = async (clerkIds: string[]): Promise<{
  profiles: Record<string, any>;
  interests: Record<string, string[]>;
}> => {
  if (clerkIds.length === 0) return { profiles: {}, interests: {} };

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
      .select("user_id, name, age, gender, personality, smoking, drinking, religion, job, languages, nationality, location, location_details, food_preference, bio, interests, profile_photo")
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
      const locDetails = p.location_details as any;
      const locationCoords = locDetails?.latitude != null && locDetails?.longitude != null
        ? { lat: locDetails.latitude, lon: locDetails.longitude }
        : typeof p.location === "object" && p.location?.lat != null
          ? { lat: (p.location as any).lat, lon: (p.location as any).lon }
          : { lat: 0, lon: 0 };

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
        bio: p.bio,
        interests: Array.isArray(p.interests) ? p.interests : [],
        avatar: p.profile_photo || undefined,
        foodPreference: p.food_preference,
        locationDisplay: (p.location_details as any)?.formatted || (typeof p.location === 'string' ? p.location : undefined),
      };
    }
  });

  const interests: Record<string, string[]> = {};
  (prefsRes.data || []).forEach((p) => {
    const clerkId = uuidToClerk.get(p.user_id);
    if (clerkId) interests[clerkId] = Array.isArray(p.interests) ? p.interests : [];
  });

  return { profiles, interests };
};

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

    const [maintenance, presetSetting] = await Promise.all([
      getSetting("maintenance_mode"),
      getSetting("matching_preset"),
    ]);

    if (maintenance && (maintenance as any).enabled) {
      return NextResponse.json({ error: "System under maintenance." }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId || userId !== clerkUserId) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

    const presetMode = (presetSetting as any)?.mode || "balanced";
    const presetConfig = getMatchingPresetConfig(presetMode);

    const redisClient = await ensureRedisConnection();
    const sessionJSON = await redisClient.get(`session:${userId}`);
    if (!sessionJSON) return NextResponse.json({ message: "Active session not found." }, { status: 404 });
    const searchingUserSession: SoloSession = JSON.parse(sessionJSON);

    const { data: userData } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .eq("isDeleted", false)
      .maybeSingle();

    if (!userData) return NextResponse.json({ message: "User not found." }, { status: 404 });

    const searchingUserUuid = userData.id;
    const currentDest = searchingUserSession.destination?.name || "Unknown";

    const fetchAllSessions = async () => {
      const keys = await redisClient.keys("session:*");
      const subKeys = keys.filter(k => k !== `session:${userId}`).slice(0, 500);
      if (subKeys.length === 0) return [];
      const stats = await redisClient.mGet(subKeys);
      return stats.filter(Boolean).map(s => JSON.parse(s!));
    };

    const [
      matchesRes, skipsRes, reportsRes, sentIntRes, recvIntRes, allSessions
    ] = await Promise.all([
      supabase.from("matches").select("user_a_id, user_b_id").or(`user_a_id.eq.${searchingUserUuid},user_b_id.eq.${searchingUserUuid}`).eq("destination_id", currentDest),
      supabase.from("match_skips").select("user_id, skipped_user_id").or(`user_id.eq.${searchingUserUuid},skipped_user_id.eq.${searchingUserUuid}`).eq("destination_id", currentDest).eq("match_type", "solo"),
      supabase.from("user_flags").select("reporter_id, user_id").or(`reporter_id.eq.${searchingUserUuid},user_id.eq.${searchingUserUuid}`),
      supabase.from("match_interests").select("to_user_id").eq("from_user_id", searchingUserUuid).eq("destination_id", currentDest).eq("status", "pending"),
      supabase.from("match_interests").select("from_user_id").eq("to_user_id", searchingUserUuid).eq("destination_id", currentDest).in("status", ["pending", "declined"]),
      fetchAllSessions()
    ]);

    const excludedUuids = new Set<string>();
    [matchesRes, skipsRes, reportsRes].forEach(res => {
      res.data?.forEach((r: any) => {
        if (r.user_a_id) excludedUuids.add(r.user_a_id);
        if (r.user_b_id) excludedUuids.add(r.user_b_id);
        if (r.user_id) excludedUuids.add(r.user_id);
        if (r.skipped_user_id) excludedUuids.add(r.skipped_user_id);
        if (r.reporter_id) excludedUuids.add(r.reporter_id);
      });
    });
    sentIntRes.data?.forEach((i: any) => excludedUuids.add(i.to_user_id));
    recvIntRes.data?.forEach((i: any) => excludedUuids.add(i.from_user_id));
    excludedUuids.add(searchingUserUuid);

    const candidates = (allSessions as SoloSession[]).filter(s => s.userId);
    const candidateClerkIds = candidates.map(s => s.userId!);

    const { data: dbUsers } = await supabase
      .from("users")
      .select("id, clerk_user_id")
      .in("clerk_user_id", candidateClerkIds);

    const validClerkIds = new Set<string>();
    dbUsers?.forEach(u => {
      if (!excludedUuids.has(u.id)) validClerkIds.add(u.clerk_user_id);
    });

    const filteredCandidates = candidates.filter(s => s.userId && validClerkIds.has(s.userId));
    
    // Fetch profiles for candidates
    const { profiles: bulkProfiles, interests: bulkInterests } = await getBulkCandidateData([...validClerkIds, userId]);

    // Ensure searching user profile is available for scoring
    if (!searchingUserSession.static_attributes) {
      searchingUserSession.static_attributes = bulkProfiles[userId];
    }

    // 1. Fetch ML scores in batch for all candidates
    const { calculateMLCompatibilityScoresBatch } = AI.Scoring;
    const mlScores = await calculateMLCompatibilityScoresBatch(searchingUserSession, filteredCandidates);

    // 2. Score matches with pre-computed ML values
    const scoredMatches = await Promise.all(filteredCandidates.map(async (matchSession) => {
      const uid = matchSession.userId!;
      
      // Merge candidate profile data
      if (!matchSession.static_attributes) {
        matchSession.static_attributes = bulkProfiles[uid];
      }
      
      // Fallback interests
      if (matchSession.static_attributes && (!matchSession.static_attributes.interests || matchSession.static_attributes.interests.length === 0)) {
        matchSession.static_attributes.interests = bulkInterests[uid] || [];
      }

      // Basic travel compatibility check
      if (!isCompatibleMatch(searchingUserSession, matchSession, presetConfig.maxDistanceKm)) return null;

      // Construct dynamic filter boosts based on user's active filters
      const filterBoost = {
        age: searchParams.get("ageMin") && searchParams.get("ageMax") ? {
          min: parseInt(searchParams.get("ageMin")!),
          max: parseInt(searchParams.get("ageMax")!),
          boost: 1.5
        } : undefined,
        gender: searchParams.get("gender") && searchParams.get("gender") !== "Any" ? {
          value: searchParams.get("gender")!,
          boost: 2.0
        } : undefined,
        personality: searchParams.get("personality") && searchParams.get("personality") !== "Any" ? {
          value: searchParams.get("personality")!,
          boost: 1.5
        } : undefined,
      };

      const mlScore = mlScores.get(uid) ?? undefined;
      const result = await calculateFinalCompatibilityScore(searchingUserSession, matchSession, filterBoost, true, mlScore);
      
      if (result.score < presetConfig.minScore) return null;

      return {
        userId: uid,
        user: {
          ...(bulkProfiles[uid] || matchSession.static_attributes || {}),
          userId: uid,
          budget: matchSession.budget,
        },
        score: result.score,
        breakdown: result.breakdown,
        destination: matchSession.destination?.name,
        budgetDifference: result.budgetDifference,
      };
    }));

    const finalMatches = scoredMatches.filter(Boolean).sort((a: any, b: any) => b.score - a.score);

    return NextResponse.json(finalMatches);

  } catch (err: any) {
    console.error("Match Solo API Error:", err);
    Sentry.captureException(err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

