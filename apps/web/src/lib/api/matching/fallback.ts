import { createAdminSupabaseClient } from "@kovari/api";
import { logger } from "@/lib/api/logger";
import { profileMapper } from "@/lib/mappers/profileMapper";

function calculateCompatibility(p1: any, p2: any): number {
  let score = 0;
  let totalWeight = 0;

  // 1. Interests (Weight: 50%)
  const interests1 = Array.isArray(p1.interests) ? p1.interests : [];
  const interests2 = Array.isArray(p2.interests) ? p2.interests : [];
  if (interests1.length > 0 && interests2.length > 0) {
    const intersection = interests1.filter((i: string) => interests2.includes(i)).length;
    const union = new Set([...interests1, ...interests2]).size;
    const jaccard = union > 0 ? intersection / union : 0;
    score += jaccard * 0.50;
    totalWeight += 0.50;
  } else {
    score += 0.3 * 0.50;
    totalWeight += 0.50;
  }

  // 2. Languages (Weight: 20%)
  const langs1 = Array.isArray(p1.languages) ? p1.languages : [];
  const langs2 = Array.isArray(p2.languages) ? p2.languages : [];
  if (langs1.length > 0 && langs2.length > 0) {
    const intersection = langs1.filter((l: string) => langs2.includes(l)).length;
    const union = new Set([...langs1, ...langs2]).size;
    const jaccard = union > 0 ? intersection / union : 0;
    score += jaccard * 0.20;
    totalWeight += 0.20;
  } else {
    score += 0.5 * 0.20;
    totalWeight += 0.20;
  }

  // 3. Personality Type (Weight: 15%)
  if (p1.personality && p2.personality) {
    const isMatch = p1.personality.toLowerCase() === p2.personality.toLowerCase() ? 1.0 : 0.2;
    score += isMatch * 0.15;
    totalWeight += 0.15;
  } else {
    score += 0.5 * 0.15;
    totalWeight += 0.15;
  }

  // 4. Lifestyle - Smoking & Drinking (Weight: 15%)
  let lifestyleScore = 0;
  if (p1.smoking && p2.smoking) {
    lifestyleScore += p1.smoking.toLowerCase() === p2.smoking.toLowerCase() ? 0.5 : 0.1;
  } else {
    lifestyleScore += 0.25;
  }
  if (p1.drinking && p2.drinking) {
    lifestyleScore += p1.drinking.toLowerCase() === p2.drinking.toLowerCase() ? 0.5 : 0.1;
  } else {
    lifestyleScore += 0.25;
  }
  score += lifestyleScore * 0.15;
  totalWeight += 0.15;

  const rawScore = totalWeight > 0 ? score / totalWeight : 0.5;
  // Normalize to 40% - 98% range
  const normalized = 0.4 + rawScore * 0.55;
  return Math.min(0.98, Math.max(0.40, normalized));
}

/**
 * Perform legacy Supabase-based matching as a fallback for solo travelers.
 */
export async function performSoloDbMatchingFallback(
  currentUserId: string,
  filters: any,
  limit: number = 30
) {
  const supabase = createAdminSupabaseClient();
  
  // Fetch current user details to calculate real similarity
  const { data: currentUserProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", currentUserId)
    .single();

  const { data: currentUserRow } = await supabase
    .from("users")
    .select("*")
    .eq("id", currentUserId)
    .single();

  const currentUserDto = (currentUserRow && currentUserProfile)
    ? profileMapper.fromDb(currentUserRow, currentUserProfile)
    : null;

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
    ` as any)
    .eq("users.isDeleted", false)
    .neq("user_id", currentUserId)
    .not("name", "ilike", "%Audit%") // Exclude audit users
    .not("username", "ilike", "%seed_%") // Exclude seed users
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

  // 3. Transform via profileMapper to standardized MatchDTO
  return (dbRows as any[]).map(p => {
    const userDto = profileMapper.fromDb(p.users, p);
    const score = currentUserDto ? calculateCompatibility(currentUserDto, userDto) : 0.75;

    return {
      userId: userDto.id,
      name: userDto.displayName,
      age: userDto.age,
      location: userDto.location || "Unknown",
      profilePhoto: userDto.avatar,
      compatibilityScore: score,
      compatibility_score: score,
      breakdown: { source: "db_fallback" },
      budgetDifference: 0,
      startDate: filters.startDate || new Date().toISOString(),
      endDate: filters.endDate || new Date().toISOString(),
      budget: filters.budget || 0,
      destination: filters.destination || userDto.location || 'India',

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
    ` as any)
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
