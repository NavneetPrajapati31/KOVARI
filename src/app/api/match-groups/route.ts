import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { findGroupMatchesForUser } from "@/lib/matching/group";
import { getCoordinatesForLocation } from "@/lib/geocoding";
import { getSetting } from "@/lib/settings";
import { getMatchingPresetConfig } from "@/lib/matching/config";
import redis, { ensureRedisConnection } from "@/lib/redis";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@clerk/nextjs/server";

// Define the types based on what the matching function expects
interface Location {
  lat: number;
  lon: number;
}

interface UserProfile {
  userId: string;
  destination: Location;
  budget: number;
  startDate: string;
  endDate: string;
  age: number;
  languages: string[];
  interests: string[];
  smoking: boolean;
  drinking: boolean;
  nationality: string;
}

interface GroupProfile {
  groupId: string;
  name: string;
  destination: Location;
  averageBudget: number;
  startDate: string;
  endDate: string;
  averageAge: number;
  dominantLanguages: string[];
  topInterests: string[];
  smokingPolicy: "Smokers Welcome" | "Mixed" | "Non-Smoking";
  drinkingPolicy: "Drinkers Welcome" | "Mixed" | "Non-Drinking";
  dominantNationalities: string[];
}

interface GroupWithCoords {
  id: string;
  name: string;
  destination: string;
  budget: number;
  start_date: string;
  end_date: string;
  creator_id: string;
  non_smokers: boolean | null;
  non_drinkers: boolean | null;
  dominant_languages: string[] | null;
  top_interests: string[] | null;
  average_age: number | null;
  members_count: number;
  cover_image: string | null;
  description: string | null;
  destinationCoords: Location;
  distance: number;
}

/**
 * Calculates distance between two locations using Haversine formula
 */
const calculateDistance = (loc1: Location, loc2: Location): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
  const dLon = (loc2.lon - loc1.lon) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(loc1.lat * (Math.PI / 180)) *
      Math.cos(loc2.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Check maintenance mode
    const maintenance = await getSetting("maintenance_mode");
    if (maintenance && (maintenance as { enabled: boolean }).enabled) {
      return NextResponse.json(
        { error: "System under maintenance. Please try later." },
        { status: 503 },
      );
    }

    const log = (msg: string, data?: object) => {
      const payload = data ? ` ${JSON.stringify(data)}` : "";
      console.log(`[MATCH-GROUPS] ${msg}${payload}`);
    };

    // Get matching preset configuration
    const presetSetting = await getSetting("matching_preset");
    const presetMode =
      (presetSetting as { mode: string } | null)?.mode || "balanced";
    const presetConfig = getMatchingPresetConfig(presetMode);
    log("Using matching preset", {
      presetMode,
      minScore: presetConfig.minScore,
      maxDistanceKm: presetConfig.maxDistanceKm,
    });

    const data = await req.json();
    const {
      destination,
      lat,
      lon,
      budget,
      startDate,
      endDate,
      userId,
      ageMin,
      ageMax,
      languages,
      interests,
      smoking,
      drinking,
      nationality,
    } = data;

    log("Request received", {
      destination,
      lat,
      lon,
      budget,
      startDate,
      endDate,
      userId,
      ageRange: `${ageMin}-${ageMax}`,
      languages,
      interests,
      smoking,
      drinking,
      nationality,
    });

    if (!destination || !budget || !startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: destination, budget, startDate, endDate",
        },
        { status: 400 },
      );
    }
    if (!userId || userId !== clerkUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get coordinates for user's destination
    let userDestinationCoords: Location;

    if (lat && lon) {
      log("Using provided coordinates for destination", { lat, lon });
      userDestinationCoords = { lat: Number(lat), lon: Number(lon) };
    } else if (typeof destination === "string") {
      log("Geocoding destination string", { destination });
      const coords = await getCoordinatesForLocation(destination);
      if (!coords) {
        log("Geocoding failed for destination", { destination });
        return NextResponse.json(
          { error: "Could not find coordinates for the specified destination" },
          { status: 400 },
        );
      }
      log("Geocoding successful", { destination, coords });
      userDestinationCoords = coords;
    } else {
      log("Destination provided as coordinates", { destination });
      userDestinationCoords = destination;
    }

    // Create a user profile with provided filter data or defaults
    const userProfile: UserProfile = {
      userId: userId || "anonymous",
      destination: userDestinationCoords,
      budget: Number(budget),
      startDate,
      endDate,
      age: ageMin || 25,
      languages: languages || ["English"],
      interests: interests || [],
      smoking: smoking || false,
      drinking: drinking || false,
      nationality: nationality || "Unknown",
    };

    log("User profile for matching", userProfile);

    const supabase = createAdminSupabaseClient();

    // Resolve internal User UUID for filtering
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_user_id", userId)
      .single();

    if (userError || !userData) {
      console.error("❌ Could not resolve internal UUID for user:", userId);
      return NextResponse.json(
        { message: "User profile not found" },
        { status: 404 },
      );
    }
    const searchingUserUuid = userData.id;

    const userDestName =
      typeof destination === "string" ? destination : "Custom Coordinates";

    // Fetch Exclusion Lists for Groups
    log("Fetching group exclusion lists");
    const [skipsResult, reportsResult, membershipsResult, interestsResult] =
      await Promise.all([
        // 1. Skips: Exclude if I skipped the group
        supabase
          .from("match_skips")
          .select("skipped_user_id") // Stores group ID for 'group' type
          .eq("user_id", searchingUserUuid)
          .eq("match_type", "group")
          .eq("destination_id", userDestName),

        // 2. Reports: Exclude if I reported the group (Global)
        supabase
          .from("group_flags")
          .select("group_id")
          .eq("reporter_id", searchingUserUuid),

        // 3. Memberships: Exclude if already a member or pending request (Global)
        supabase
          .from("group_memberships")
          .select("group_id")
          .eq("user_id", searchingUserUuid),

        // 4. Interests: Exclude if I already expressed interest (Redundant but safe)
        supabase
          .from("match_interests")
          .select("to_user_id") // Stores group ID for 'group' type
          .eq("from_user_id", searchingUserUuid)
          .eq("match_type", "group")
          .eq("destination_id", userDestName),
      ]);

    const excludedGroupIds = new Set<string>();

    // Add Skips
    skipsResult.data?.forEach((s) => excludedGroupIds.add(s.skipped_user_id));
    // Add Reports
    reportsResult.data?.forEach((r) => excludedGroupIds.add(r.group_id));
    // Add Memberships
    membershipsResult.data?.forEach((m) => excludedGroupIds.add(m.group_id));
    // Add Interests
    interestsResult.data?.forEach((i) => excludedGroupIds.add(i.to_user_id));

    const excludedIdsArray = Array.from(excludedGroupIds);
    log("Exclusion lists fetched", {
      excludedCount: excludedIdsArray.length,
      fromSkips: skipsResult.data?.length ?? 0,
      fromReports: reportsResult.data?.length ?? 0,
      fromMemberships: membershipsResult.data?.length ?? 0,
      fromInterests: interestsResult.data?.length ?? 0,
      excludedIds: excludedIdsArray.slice(0, 10),
      userDestName,
    });

    // Fetch groups with all necessary fields from the schema
    log("Fetching groups from database", {
      filters: {
        status: "active",
        is_public: true,
        creatorExcluded: searchingUserUuid,
        ageRange:
          ageMin !== undefined || ageMax !== undefined
            ? { ageMin, ageMax }
            : null,
        smokingDrinking: "soft-filter-via-scoring (no hard DB filter)",
      },
    });
    let groupsQuery = supabase
      .from("groups")
      .select(
        `
        id,
        name,
        destination,
        budget,
        start_date,
        end_date,
        creator_id,
        non_smokers,
        non_drinkers,
        dominant_languages,
        top_interests,
        average_age,
        members_count,
        cover_image,
        description,
        destination_lat,
        destination_lon
      `,
      )
      .eq("status", "active") // Only match approved groups
      .eq("is_public", true) // Only match public groups (discoverable in explore)
      .neq("creator_id", searchingUserUuid); // Exclude my own groups

    // Apply exclusion filter if there are IDs to exclude
    if (excludedIdsArray.length > 0) {
      groupsQuery = groupsQuery.not(
        "id",
        "in",
        `(${excludedIdsArray.join(",")})`,
      );
    }

    // --- APPLY FILTERS ---
    // 1. Age Filter
    if (ageMin !== undefined)
      groupsQuery = groupsQuery.gte("average_age", ageMin);
    if (ageMax !== undefined)
      groupsQuery = groupsQuery.lte("average_age", ageMax);

    // 2. Smoking Filter - REMOVED hard filter; lifestyle scoring in findGroupMatchesForUser handles this.
    // Previously, smoking:false (user prefers non-smoking) filtered to ONLY non_smokers=true groups,
    // which excluded "Smokers Welcome" and "Mixed" groups entirely. That was too strict.
    // Now we let all groups through; lifestyle compatibility is factored into the score.

    // 3. Drinking Filter - REMOVED for same reason as smoking.

    // 4. Nationality Filter (Strict?)
    // This is tricky as nationality is on the Creator, not the group table directly?
    // Wait, typical schema: user profile has nationality.
    // The query fetches groups.
    // We already fetch creator profiles later. We can filter there.
    // Or if we need strict filter, we might need a join or filter in memory.
    // I'll filter in memory after fetching creators.

    const { data: groups, error } = await groupsQuery;

    if (error) {
      log("Database error fetching groups", {
        error: error.message,
        code: error.code,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    log("Raw groups from DB (before distance filter)", {
      count: groups?.length ?? 0,
      groupIds: groups?.map((g: any) => g.id) ?? [],
      destinations:
        groups?.map((g: any) => ({
          id: g.id,
          dest: g.destination,
          lat: g.destination_lat,
          lon: g.destination_lon,
        })) ?? [],
    });

    if (!groups || groups.length === 0) {
      log("No groups from DB - possible causes", {
        hints: [
          "status must be 'active'",
          "is_public must be true",
          "creator_id must not be searching user",
          "age filter: groups with null average_age are excluded (gte/lte)",
          "smoking/drinking filters may exclude groups",
          "exclusion lists (skips, reports, memberships, interests)",
        ],
      });
      return NextResponse.json({ groups: [] });
    }
    const groupsWithCoords: GroupWithCoords[] = [];
    const distanceExcluded: {
      id: string;
      reason: string;
      distance?: number;
    }[] = [];

    for (const group of groups) {
      // Check name similarity for robustness
      const namesMatch =
        typeof destination === "string" &&
        group.destination &&
        (group.destination.toLowerCase().includes(destination.toLowerCase()) ||
          destination.toLowerCase().includes(group.destination.toLowerCase()));

      if (group.destination_lat && group.destination_lon) {
        const groupCoords = {
          lat: Number(group.destination_lat),
          lon: Number(group.destination_lon),
        };
        const distance = calculateDistance(userDestinationCoords, groupCoords);

        if (distance <= presetConfig.maxDistanceKm || namesMatch) {
          const effectiveDistance =
            namesMatch && distance > presetConfig.maxDistanceKm ? 0 : distance;
          groupsWithCoords.push({
            ...group,
            destinationCoords: groupCoords,
            distance: effectiveDistance,
          });
        } else {
          distanceExcluded.push({ id: group.id, reason: "too_far", distance });
        }
      } else if (group.destination) {
        const groupCoords = await getCoordinatesForLocation(group.destination);
        if (groupCoords) {
          const distance = calculateDistance(
            userDestinationCoords,
            groupCoords,
          );

          if (distance <= presetConfig.maxDistanceKm || namesMatch) {
            const effectiveDistance =
              namesMatch && distance > presetConfig.maxDistanceKm
                ? 0
                : distance;
            groupsWithCoords.push({
              ...group,
              destinationCoords: groupCoords,
              distance: effectiveDistance,
            });
          } else {
            distanceExcluded.push({
              id: group.id,
              reason: "too_far",
              distance,
            });
          }
        } else {
          distanceExcluded.push({
            id: group.id,
            reason: "geocoding_failed",
            distance: undefined,
          });
        }
      } else {
        distanceExcluded.push({
          id: group.id,
          reason: "no_destination",
          distance: undefined,
        });
      }
    }

    log("Distance filter results", {
      userDestinationCoords,
      maxDistanceKm: presetConfig.maxDistanceKm,
      passed: groupsWithCoords.length,
      excluded: distanceExcluded.length,
      excludedDetails: distanceExcluded.slice(0, 20),
    });

    if (groupsWithCoords.length === 0) {
      log("No groups within distance - all excluded", { distanceExcluded });
      return NextResponse.json({ groups: [] });
    }

    // Get creator profiles for nationality information
    const creatorIds = [...new Set(groupsWithCoords.map((g) => g.creator_id))];
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, username, profile_photo, nationality")
      .in("user_id", creatorIds);

    if (profilesError) {
      console.error("Error fetching creator profiles:", profilesError);
    }

    // Create a map of profiles by user_id
    const profilesMap = (profiles || []).reduce((acc: any, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {});

    // Transform groups into the expected format for matching
    log("Transforming groups into profiles for matching");
    const groupProfiles: GroupProfile[] = groupsWithCoords.map((group: any) => {
      const creator = profilesMap[group.creator_id];

      // Determine smoking policy based on group's non_smokers boolean field
      let smokingPolicy: "Smokers Welcome" | "Mixed" | "Non-Smoking";
      if (group.non_smokers === true) {
        smokingPolicy = "Non-Smoking";
      } else if (group.non_smokers === false) {
        smokingPolicy = "Smokers Welcome";
      } else {
        smokingPolicy = "Mixed"; // Default to mixed if null
      }

      // Determine drinking policy based on group's non_drinkers boolean field
      let drinkingPolicy: "Drinkers Welcome" | "Mixed" | "Non-Drinking";
      if (group.non_drinkers === true) {
        drinkingPolicy = "Non-Drinking";
      } else if (group.non_drinkers === false) {
        drinkingPolicy = "Drinkers Welcome";
      } else {
        drinkingPolicy = "Mixed"; // Default to mixed if null
      }

      return {
        groupId: group.id,
        name: group.name || "Unknown Group",
        destination: group.destinationCoords,
        averageBudget: Number(group.budget) || 0,
        startDate: group.start_date || "",
        endDate: group.end_date || "",
        averageAge: Number(group.average_age) || 25,
        dominantLanguages: group.dominant_languages || ["English"],
        topInterests: group.top_interests || [],
        smokingPolicy,
        drinkingPolicy,
        dominantNationalities: creator?.nationality
          ? [creator.nationality]
          : [],
      };
    });

    log("Group profiles created", {
      count: groupProfiles.length,
      profileIds: groupProfiles.map((p) => p.groupId),
    });

    // Filter by Nationality (In-Memory)
    let filteredGroupProfiles = groupProfiles;
    if (nationality && nationality !== "Unknown" && nationality !== "Any") {
      const beforeNationality = filteredGroupProfiles.length;
      filteredGroupProfiles = groupProfiles.filter((g) =>
        g.dominantNationalities.some(
          (n) => n.toLowerCase() === nationality.toLowerCase(),
        ),
      );
      log("Nationality filter", {
        requestedNationality: nationality,
        before: beforeNationality,
        after: filteredGroupProfiles.length,
        excluded: beforeNationality - filteredGroupProfiles.length,
      });
    }

    // Use the group matching algorithm to get scored matches
    const matches = findGroupMatchesForUser(
      userProfile,
      filteredGroupProfiles,
      presetConfig.maxDistanceKm,
    );
    log("Matching algorithm completed", {
      matchCount: matches.length,
      scores: matches.map((m) => ({ id: m.group.groupId, score: m.score })),
    });

    // Filter by preset minScore
    const filteredMatches = matches.filter(
      (match) => match.score >= presetConfig.minScore,
    );
    log("Scoring and minScore filter", {
      preset: presetMode,
      minScore: presetConfig.minScore,
      beforeMinScore: matches.length,
      afterMinScore: filteredMatches.length,
      scoresBeforeFilter: matches.map((m) => ({
        id: m.group.groupId,
        name: m.group.name,
        score: m.score,
      })),
      excludedByMinScore: matches
        .filter((m) => m.score < presetConfig.minScore)
        .map((m) => ({ id: m.group.groupId, score: m.score })),
    });

    // Transform the results to include group details and maintain distance info
    const safeMatches = filteredMatches.map((match) => {
      const originalGroup = groupsWithCoords.find(
        (g) => g.id === match.group.groupId,
      );
      const creator = originalGroup
        ? profilesMap[originalGroup.creator_id]
        : null;

      // Format dates properly
      const formatDate = (dateString: string | null) => {
        if (!dateString) return "Not specified";
        try {
          return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          });
        } catch {
          return "Invalid date";
        }
      };

      return {
        id: match.group.groupId,
        name: match.group.name,
        destination: originalGroup?.destination || "Unknown Destination",
        budget: match.group.averageBudget,
        startDate: formatDate(originalGroup?.start_date || null),
        endDate: formatDate(originalGroup?.end_date || null),
        score: match.score,
        breakdown: match.breakdown,
        members: originalGroup?.members_count || 0,
        distance: originalGroup?.distance || 0,
        cover_image: originalGroup?.cover_image || null,
        description: originalGroup?.description || null,
        creator: {
          name: creator?.name || "Unknown",
          username: creator?.username || "unknown",
          avatar: creator?.profile_photo || "",
        },
        tags: match.group.topInterests || [],
      };
    });

    log("Final response", {
      count: safeMatches.length,
      groupIds: safeMatches.map((m) => m.id),
    });

    // Increment match generation counter for metrics
    if (safeMatches.length > 0) {
      try {
        const redisClient = await ensureRedisConnection();
        await redisClient.incr("metrics:matches:daily");
        await redisClient.expire("metrics:matches:daily", 86400); // 24 hours TTL
      } catch (e) {
        console.warn("Failed to increment match counter:", e);
        // Don't fail the request if metrics tracking fails
      }
    }

    return NextResponse.json({ groups: safeMatches });
  } catch (err: any) {
    // Capture error in Sentry for alerting
    Sentry.captureException(err, {
      tags: {
        scope: "match-api",
        route: "POST /api/match-groups",
      },
    });
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 },
    );
  }
}
