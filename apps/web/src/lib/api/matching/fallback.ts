import { createAdminSupabaseClient } from "@kovari/api";
import { logger } from "@/lib/api/logger";
import { profileMapper } from "@/lib/mappers/profileMapper";

/**
 * Perform legacy Supabase-based matching as a fallback for solo travelers.
 */
export async function performSoloDbMatchingFallback(
  currentUserId: string,
  filters: any,
  limit: number = 30
) {
  const supabase = createAdminSupabaseClient();
  
  // 1. Fetch profiles (excluding self) with full user JOIN
  let query = supabase
    .from("profiles")
    .select(`
      *,
      users!inner (
        id,
        email,
        name,
        isDeleted
      )
    `)
    .eq("users.isDeleted", false)
    .neq("user_id", currentUserId)
    .not("created_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Apply basic filters
  if (filters.gender && filters.gender !== "Any") {
    query = query.eq("gender", filters.gender);
  }
  if (filters.ageMin) {
    query = query.gte("age", filters.ageMin);
  }
  if (filters.ageMax) {
    query = query.lte("age", filters.ageMax);
  }

  const { data: dbRows, error } = await query;
  if (error || !dbRows) return [];

  // 2. Fetch travel preferences for these users
  const userIds = dbRows.map(p => p.user_id);
  const { data: travelPrefs } = await supabase
    .from("travel_preferences")
    .select("*")
    .in("user_id", userIds);

  const prefsMap = (travelPrefs || []).reduce((acc: any, pref) => {
    acc[pref.user_id] = pref;
    return acc;
  }, {});

  // 3. Transform via profileMapper to standardized MatchDTO
  return dbRows.map(p => {
    const pref = prefsMap[p.user_id];
    const userDto = profileMapper.fromDb(p.users, p);

    return {
      userId: userDto.id,
      name: userDto.displayName,
      age: userDto.age,
      location: userDto.location || "Unknown",
      profilePhoto: userDto.avatar,
      compatibilityScore: 0.5, // Constant score for fallback
      breakdown: { source: "db_fallback" },
      budgetDifference: 0,
      startDate: pref?.start_date,
      endDate: pref?.end_date,
      budget: pref?.budget,
      user: {
        userId: userDto.id,
        name: userDto.displayName,
        username: userDto.username,
        bio: userDto.bio,
        avatar: userDto.avatar,
        gender: userDto.gender,
        age: userDto.age,
        location: userDto.location,
        locationDisplay: userDto.location,
        nationality: userDto.nationality,
        profession: userDto.profession,
        religion: userDto.religion,
        smoking: userDto.smoking,
        drinking: userDto.drinking,
        personality: userDto.personality,
        foodPreference: userDto.foodPreference,
        interests: userDto.interests,
        languages: userDto.languages
      }
    };
  });
}


/**
 * Perform legacy Supabase-based matching as a fallback for groups.
 */
export async function performGroupDbMatchingFallback(
  currentUserId: string,
  filters: any,
  limit: number = 30
) {
  const supabase = createAdminSupabaseClient();

  let query = supabase
    .from("groups")
    .select(`
      id,
      name,
      is_public,
      destination,
      start_date,
      end_date,
      creator_id,
      created_at,
      cover_image,
      members_count,
      description,
      status,
      budget,
      ai_overview,
      non_smokers,
      non_drinkers,
      destination_lat,
      destination_lon
    `)
    .in("status", ["active", "pending"])
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Apply Search Logic (Web Parity: Extract city from formatted string)
  if (filters && filters.destination && filters.destination !== "Any") {
    const normalizedDest = filters.destination.split(",")[0].trim();
    
    // If we have coordinates, prioritize precise spatial matching
    if (filters.lat && filters.lon) {
      const epsilon = 0.5; // Roughly 50km
      query = query
        .gte("destination_lat", filters.lat - epsilon)
        .lte("destination_lat", filters.lat + epsilon)
        .gte("destination_lon", filters.lon - epsilon)
        .lte("destination_lon", filters.lon + epsilon);
    } else {
      // Fallback to name-based match
      query = query.ilike("destination", `%${normalizedDest}%`);
    }
  }

  const { data: groups, error } = await query;
  
  if (error) {
    logger.error("GROUP-FALLBACK", "DB Match Query Failed", error);
    return [];
  }

  if (!groups) return [];

  return groups.map((g: any) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    destination: g.destination,
    membersCount: g.members_count || 1, // Default to 1 (creator)
    score: 0.5,
    startDate: g.start_date,
    endDate: g.end_date,
    creatorId: g.creator_id,
    status: g.status,
    budget: g.budget,
    ai_overview: g.ai_overview,
    coverImage: g.cover_image,
    is_public: g.is_public
  }));
}
