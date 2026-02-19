import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { findGroupMatchesForUser } from "@/lib/matching/group";
import { getCoordinatesForLocation } from "@/lib/geocoding";
import { getSetting } from "@/lib/settings";
import { getMatchingPresetConfig } from "@/lib/matching/config";
import redis, { ensureRedisConnection } from "@/lib/redis";
import * as Sentry from "@sentry/nextjs";

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
    // Check maintenance mode
    const maintenance = await getSetting("maintenance_mode");
    if (maintenance && (maintenance as { enabled: boolean }).enabled) {
      return NextResponse.json(
        { error: "System under maintenance. Please try later." },
        { status: 503 }
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

    const data = await req.json();
    const {
      destination,
      budget,
      startDate,
      endDate,
      userId,
      age,
      languages,
      interests,
      smoking,
      drinking,
      nationality,
    } = data;

    console.log("Received request data:", {
      destination,
      budget,
      startDate,
      endDate,
      userId,
      age,
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
        { status: 400 }
      );
    }

    // Get coordinates for user's destination
    let userDestinationCoords: Location;
    if (typeof destination === "string") {
      console.log("Getting coordinates for destination:", destination);
      const coords = await getCoordinatesForLocation(destination);
      if (!coords) {
        console.error(
          "Could not find coordinates for destination:",
          destination
        );
        return NextResponse.json(
          { error: "Could not find coordinates for the specified destination" },
          { status: 400 }
        );
      }
      console.log("Found coordinates for destination:", coords);
      userDestinationCoords = coords;
    } else {
      console.log("Destination is already coordinates:", destination);
      userDestinationCoords = destination;
    }

    // Create a user profile with provided filter data or defaults
    const userProfile: UserProfile = {
      userId: userId || "anonymous",
      destination: userDestinationCoords,
      budget: Number(budget),
      startDate,
      endDate,
      age: age || 25,
      languages: languages || ["English"],
      interests: interests || [],
      smoking: smoking || false,
      drinking: drinking || false,
      nationality: nationality || "Unknown",
    };

    console.log("User profile for matching:", userProfile);

    const supabase = createRouteHandlerSupabaseClient();

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
        { status: 404 }
      );
    }
    const searchingUserUuid = userData.id;

    const userDestName = typeof destination === "string" ? destination : "Custom Coordinates";

    // Fetch Exclusion Lists for Groups
    console.log("🔍 Fetching group exclusion lists...");
    const [
      skipsResult,
      reportsResult,
      membershipsResult,
      interestsResult
    ] = await Promise.all([
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
        .eq("destination_id", userDestName)
    ]);

    const excludedGroupIds = new Set<string>();
    
    // Add Skips
    skipsResult.data?.forEach(s => excludedGroupIds.add(s.skipped_user_id));
    // Add Reports
    reportsResult.data?.forEach(r => excludedGroupIds.add(r.group_id));
    // Add Memberships
    membershipsResult.data?.forEach(m => excludedGroupIds.add(m.group_id));
    // Add Interests
    interestsResult.data?.forEach(i => excludedGroupIds.add(i.to_user_id));

    const excludedIdsArray = Array.from(excludedGroupIds);
    console.log(`🚫 Excluding ${excludedIdsArray.length} groups based on history`);

    // Fetch groups with all necessary fields from the schema
    console.log("Fetching groups from database...");
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
        description
      `
      )
      .eq("status", "active") // Only match approved groups
      .neq("creator_id", searchingUserUuid); // Exclude my own groups

    // Apply exclusion filter if there are IDs to exclude
    if (excludedIdsArray.length > 0) {
      groupsQuery = groupsQuery.not("id", "in", `(${excludedIdsArray.join(",")})`);
    }

    const { data: groups, error } = await groupsQuery;

    if (error) {
      console.error("Database error fetching groups:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!groups || groups.length === 0) {
      return NextResponse.json({ groups: [] });
    }
    const groupsWithCoords: GroupWithCoords[] = [];
    for (const group of groups) {
      if (group.destination) {
        console.log(
          `Getting coordinates for group ${group.id} destination: ${group.destination}`
        );
        const groupCoords = await getCoordinatesForLocation(group.destination);
        if (groupCoords) {
          const distance = calculateDistance(
            userDestinationCoords,
            groupCoords
          );
          console.log(`Group ${group.id} is ${distance.toFixed(2)}km away`);
          if (distance <= presetConfig.maxDistanceKm) {
            // Only include groups within preset maxDistanceKm
            groupsWithCoords.push({
              ...group,
              destinationCoords: groupCoords,
              distance,
            });
          } else {
            console.log(
              `Group ${group.id} is too far (${distance.toFixed(2)}km > 200km)`
            );
          }
        } else {
          console.log(
            `Could not get coordinates for group ${group.id} destination: ${group.destination}`
          );
        }
      } else {
        console.log(`Group ${group.id} has no destination`);
      }
    }

    if (groupsWithCoords.length === 0) {
      console.log(
        `No groups found within ${presetConfig.maxDistanceKm}km distance`
      );
      return NextResponse.json({ groups: [] });
    }

    console.log(
      `Found ${groupsWithCoords.length} groups within distance limit:`,
      groupsWithCoords
    );

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
    console.log("Transforming groups into profiles for matching...");
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

    console.log(
      `Created ${groupProfiles.length} group profiles for matching:`,
      groupProfiles
    );

    // Use the group matching algorithm to get scored matches (with ML scoring)
    const matches = await findGroupMatchesForUser(
      userProfile,
      groupProfiles,
      presetConfig.maxDistanceKm,
      true // Enable ML scoring
    );
    console.log(
      `Matching algorithm returned ${matches.length} matches:`,
      matches
    );

    // Filter by preset minScore
    const filteredMatches = matches.filter(
      (match) => match.score >= presetConfig.minScore
    );
    console.log(
      `After applying minScore filter (${presetConfig.minScore}): ${filteredMatches.length} matches remain`
    );

    // Transform the results to include group details and maintain distance info
    const safeMatches = filteredMatches.map((match) => {
      const originalGroup = groupsWithCoords.find(
        (g) => g.id === match.group.groupId
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

    console.log(`Returning ${safeMatches.length} final matches:`, safeMatches);

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
      { status: 500 }
    );
  }
}
