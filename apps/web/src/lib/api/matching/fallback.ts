import { createAdminSupabaseClient } from "@kovari/api";

/**
 * Perform legacy Supabase-based matching as a fallback for solo travelers.
 */
export async function performSoloDbMatchingFallback(
  currentUserId: string,
  filters: any,
  limit: number = 30
) {
  const supabase = createAdminSupabaseClient();
  
  // 1. Fetch profiles (excluding self)
  let query = supabase
    .from("profiles")
    .select(`
      id,
      name,
      username,
      age,
      bio,
      profile_photo,
      user_id,
      gender,
      created_at,
      location,
      users (
        "isDeleted"
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

  const { data: profiles, error } = await query;
  if (error || !profiles) return [];

  // 2. Fetch travel preferences for these profiles
  const userIds = profiles.map(p => p.user_id);
  const { data: travelPrefs } = await supabase
    .from("travel_preferences")
    .select("*")
    .in("user_id", userIds);

  const prefsMap = (travelPrefs || []).reduce((acc: any, pref) => {
    acc[pref.user_id] = pref;
    return acc;
  }, {});

  // 3. Transform to standardized MatchDTO
  return profiles.map(p => {
    const pref = prefsMap[p.user_id];
    return {
      userId: p.user_id,
      name: p.name || "Unknown",
      age: p.age || 0,
      location: p.location || "Unknown",
      profilePhoto: p.profile_photo || "",
      compatibilityScore: 0.5, // Constant score for fallback
      breakdown: { source: "db_fallback" },
      budgetDifference: 0,
      startDate: pref?.start_date,
      endDate: pref?.end_date,
      budget: pref?.budget,
      user: {
        id: p.id,
        name: p.name,
        username: p.username,
        bio: p.bio,
        avatar: p.profile_photo,
        gender: p.gender,
        age: p.age
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
      creator:users!creator_id(name)
    `)
    .eq("is_public", true)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (filters.destination && filters.destination !== "Any") {
    query = query.ilike("destination", `%${filters.destination}%`);
  }

  const { data: groups, error } = await query;
  if (error || !groups) return [];

  return groups.map((g: any) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    destination: g.destination,
    membersCount: g.members_count || 0,
    score: 0.5,
    startDate: g.start_date,
    endDate: g.end_date,
    creatorId: g.creator_id,
    creator: Array.isArray(g.creator) ? g.creator[0] : g.creator,
    coverImage: g.cover_image,
    is_public: g.is_public
  }));
}
