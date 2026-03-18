import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { findGroupMatchesForUser } from "@/lib/matching/group";
import { getCoordinatesForLocation } from "@/lib/geocoding";
import { getSetting } from "@/lib/settings";
import { getMatchingPresetConfig } from "@/lib/matching/config";
import redis, { ensureRedisConnection } from "@/lib/redis";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@clerk/nextjs/server";
import { getHaversineDistance } from "@/lib/matching/solo";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [maintenance, presetSetting] = await Promise.all([
      getSetting("maintenance_mode"),
      getSetting("matching_preset"),
    ]);

    if (maintenance && (maintenance as any).enabled) {
      return NextResponse.json({ error: "System under maintenance." }, { status: 503 });
    }

    const presetMode = (presetSetting as any)?.mode || "balanced";
    const presetConfig = getMatchingPresetConfig(presetMode);

    const data = await req.json();
    const {
      destination, lat, lon, budget, startDate, endDate, userId,
      ageMin, ageMax, languages, interests, smoking, drinking, nationality
    } = data;

    if (!destination || !budget || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    if (!userId || userId !== clerkUserId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const supabase = createAdminSupabaseClient();
    const userDestName = typeof destination === "string" ? destination : "Custom";
    
    const [userRes, userDestCoords] = await Promise.all([
      supabase.from("users").select("id").eq("clerk_user_id", userId).single(),
      (!lat || !lon) && typeof destination === "string" ? getCoordinatesForLocation(destination) : Promise.resolve(null)
    ]);

    if (userRes.error || !userRes.data) return NextResponse.json({ error: "User not found." }, { status: 404 });
    const searchingUserUuid = userRes.data.id;

    const userDestinationCoords = (lat && lon) ? { lat: Number(lat), lon: Number(lon) } : userDestCoords || (typeof destination === "object" ? destination : null);
    if (!userDestinationCoords) return NextResponse.json({ error: "Invalid coordinates." }, { status: 400 });

    const userProfile = {
      userId, destination: userDestinationCoords, budget: Number(budget),
      startDate, endDate, age: ageMin || 25,
      languages: languages || ["English"], interests: interests || [],
      smoking: !!smoking, drinking: !!drinking, nationality: nationality || "Any"
    };

    // Exclusion lists
    const [skips, reports, memberships, interestsSent] = await Promise.all([
      supabase.from("match_skips").select("skipped_user_id").eq("user_id", searchingUserUuid).eq("match_type", "group").eq("destination_id", userDestName),
      supabase.from("group_flags").select("group_id").eq("reporter_id", searchingUserUuid),
      supabase.from("group_memberships").select("group_id").eq("user_id", searchingUserUuid),
      supabase.from("match_interests").select("to_user_id").eq("from_user_id", searchingUserUuid).eq("match_type", "group").eq("destination_id", userDestName)
    ]);

    const excludedIds = new Set<string>();
    skips.data?.forEach(s => excludedIds.add(s.skipped_user_id));
    reports.data?.forEach(r => excludedIds.add(r.group_id));
    memberships.data?.forEach(m => excludedIds.add(m.group_id));
    interestsSent.data?.forEach(i => excludedIds.add(i.to_user_id));

    // Fetch candidate groups from the optimized view
    const { data: groups, error: groupErr } = await supabase
      .from("matchable_groups_with_creator")
      .select("id, name, destination, budget, start_date, end_date, creator_id, non_smokers, non_drinkers, dominant_languages, top_interests, average_age, members_count, cover_image, description, destination_lat, destination_lon, creator_name, creator_username, creator_profile_photo, creator_nationality")
      .eq("status", "active")
      .eq("is_public", true)
      .neq("creator_id", searchingUserUuid)
      .limit(300);

    if (groupErr || !groups || groups.length === 0) return NextResponse.json({ groups: [] });

    // Filter and score groups
    const groupProfiles = await Promise.all(groups.filter(g => !excludedIds.has(g.id)).map(async g => {
      const gCoords = (g.destination_lat != null && g.destination_lon != null) 
        ? { lat: Number(g.destination_lat), lon: Number(g.destination_lon) }
        : await getCoordinatesForLocation(g.destination);
      
      if (!gCoords) return null;

      const distance = getHaversineDistance(userDestinationCoords.lat, userDestinationCoords.lon, gCoords.lat, gCoords.lon);
      const nameMatch = g.destination?.toLowerCase().includes(userDestName.toLowerCase());
      
      if (distance > presetConfig.maxDistanceKm && !nameMatch) return null;

      return {
        groupId: g.id,
        name: g.name,
        destination: gCoords,
        averageBudget: Number(g.budget) || 0,
        startDate: g.start_date,
        endDate: g.end_date,
        averageAge: Number(g.average_age) || 25,
        dominantLanguages: g.dominant_languages || ["English"],
        topInterests: g.top_interests || [],
        smokingPolicy: g.non_smokers ? "Non-Smoking" : g.non_smokers === false ? "Smokers Welcome" : "Mixed",
        drinkingPolicy: g.non_drinkers ? "Non-Drinking" : g.non_drinkers === false ? "Drinkers Welcome" : "Mixed",
        dominantNationalities: g.creator_nationality ? [g.creator_nationality] : [],
        distanceKm: distance,
        originalData: g
      };
    }));

    const validProfiles = groupProfiles.filter(Boolean) as any[];
    const matches = await findGroupMatchesForUser(userProfile as any, validProfiles, presetConfig.maxDistanceKm, undefined, true);

    const result = matches
      .filter(m => m.score >= presetConfig.minScore)
      .map(m => {
        const g = (m.group as any).originalData;
        return {
          id: m.group.groupId,
          name: m.group.name,
          destination: g.destination,
          budget: m.group.averageBudget,
          startDate: g.start_date,
          endDate: g.end_date,
          score: m.score,
          breakdown: m.breakdown,
          members: g.members_count || 0,
          distance: (m.group as any).distanceKm,
          cover_image: g.cover_image,
          description: g.description,
          creator: {
            name: g.creator_name,
            username: g.creator_username,
            avatar: g.creator_profile_photo
          },
          tags: m.group.topInterests,
          smokingPolicy: m.group.smokingPolicy,
          drinkingPolicy: m.group.drinkingPolicy,
          languages: m.group.dominantLanguages
        };
      });

    return NextResponse.json({ groups: result });

  } catch (err: any) {
    Sentry.captureException(err);
    console.error("Match Groups API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
