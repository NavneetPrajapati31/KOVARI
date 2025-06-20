import { createClient } from "./supabase";

// Traveler type for TravelerCard
export interface Traveler {
  id: string;
  name: string;
  username?: string;
  age: number;
  bio: string;
  profilePhoto: string;
  destination: string;
  travelDates: string;
  matchStrength: "high" | "medium" | "low";
  created_at: string;
}

// Group type for GroupCard
export interface Group {
  id: string;
  name: string;
  privacy: "public" | "private" | "invite-only";
  destination: string;
  dateRange: {
    start: Date;
    end?: Date;
    isOngoing: boolean;
  };
  memberCount: number;
  userStatus: "member" | "pending" | "blocked" | null;
  creator: {
    name: string;
    avatar?: string;
  };
  created_at: string;
  cover_image?: string;
}

// Add FiltersState type (should be moved to a shared types file in production)
export interface FiltersState {
  destination: string;
  dateStart: Date | undefined;
  dateEnd: Date | undefined;
  ageMin: number;
  ageMax: number;
  gender: string;
  interests: string[];
}

/**
 * Fetch solo travelers (excluding current user) with cursor pagination and filters
 */
export const fetchSoloTravelers = async (
  currentUserId: string,
  filters: FiltersState,
  cursor: string | null = null,
  limit: number = 20
): Promise<{ data: Traveler[]; nextCursor: string | null }> => {
  try {
    const supabase = createClient();

    let query = supabase
      .from("profiles")
      .select(
        `
        id,
        name,
        username,
        age,
        bio,
        profile_photo,
        user_id,
        gender,
        created_at,
        users (
          clerk_user_id
        )
      `
      )
      .not("created_at", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }
    // Apply filters to the query where possible
    if (filters.gender && filters.gender !== "Any") {
      query = query.eq("gender", filters.gender);
    }
    if (filters.ageMin) {
      query = query.gte("age", filters.ageMin);
    }
    if (filters.ageMax) {
      query = query.lte("age", filters.ageMax);
    }

    const { data: profiles, error: profilesError } = await query;

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError, {
        currentUserId,
        cursor,
        limit,
      });
      return { data: [], nextCursor: null };
    }

    // Filter out current user after the join
    const filteredProfiles = (profiles || []).filter(
      (profile: any) => profile.users?.clerk_user_id !== currentUserId
    );

    // Then fetch travel preferences for these profiles
    const userIds = filteredProfiles.map((p: any) => p.user_id);
    const { data: travelPrefs, error: prefsError } = await supabase
      .from("travel_preferences")
      .select("user_id, destinations, start_date, end_date, interests")
      .in("user_id", userIds);

    if (prefsError) {
      console.error("Error fetching travel preferences:", prefsError);
    }

    // Create a map of travel preferences by user_id
    const prefsMap = (travelPrefs || []).reduce((acc: any, pref) => {
      acc[pref.user_id] = pref;
      return acc;
    }, {});

    // Map the data and apply destination, date, interests filters
    const mapped = filteredProfiles
      .map((profile: any) => {
        const travelPref = prefsMap[profile.user_id];
        const startDate = travelPref?.start_date
          ? new Date(travelPref.start_date)
          : null;
        const endDate = travelPref?.end_date
          ? new Date(travelPref.end_date)
          : null;
        const interests = travelPref?.interests || [];
        const destination = travelPref?.destinations?.[0] || "";

        // Filter by destination (partial, case-insensitive)
        if (
          filters.destination &&
          filters.destination !== "Any" &&
          destination &&
          !destination.toLowerCase().includes(filters.destination.toLowerCase())
        ) {
          return null;
        }
        // Filter by interests
        if (
          filters.interests.length > 0 &&
          !filters.interests.some((i) => interests.includes(i))
        ) {
          return null;
        }
        // Filter by date range (overlap logic: only include if ranges overlap)
        if (filters.dateStart || filters.dateEnd) {
          if (startDate && endDate) {
            if (filters.dateStart && endDate < filters.dateStart) {
              return null;
            }
            if (filters.dateEnd && startDate > filters.dateEnd) {
              return null;
            }
          }
        }

        const formatDateRange = (start: Date | null, end: Date | null) => {
          if (!start) return "";
          if (!end) return new Date(start).toLocaleDateString();
          return `${new Date(start).toLocaleDateString()} - ${new Date(
            end
          ).toLocaleDateString()}`;
        };

        return {
          id: profile.id || "",
          name: profile.name || "",
          username: profile.username || "",
          age: profile.age || 0,
          bio: profile.bio || "",
          profilePhoto: profile.profile_photo || "",
          destination,
          travelDates: formatDateRange(startDate, endDate),
          matchStrength: "medium" as const,
          created_at: profile.created_at,
        };
      })
      .filter(Boolean);

    const hasMore = mapped.length === limit;
    const nextCursor = hasMore
      ? mapped[mapped.length - 1]?.created_at ?? null
      : null;
    return { data: mapped as Traveler[], nextCursor };
  } catch (e) {
    console.error("Unexpected error in fetchSoloTravelers:", e, {
      currentUserId,
      cursor,
      limit,
    });
    return { data: [], nextCursor: null };
  }
};

/**
 * Fetch public groups not joined by user with cursor pagination and filters
 */
export const fetchPublicGroups = async (
  currentUserId: string,
  filters: FiltersState,
  cursor: string | null = null,
  limit: number = 20
): Promise<{ data: Group[]; nextCursor: string | null }> => {
  const supabase = createClient();
  let query = supabase
    .from("groups")
    .select(
      `
      id,
      name,
      is_public,
      destination,
      start_date,
      end_date,
      creator_id,
      created_at,
      cover_image
    `
    )
    .eq("is_public", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }
  // Apply destination filter
  if (filters.destination && filters.destination !== "Any") {
    query = query.ilike("destination", `%${filters.destination}%`);
  }

  const { data: groups, error } = await query;

  if (error) {
    console.error("Error fetching groups:", error, "Full response:", {
      groups,
      error,
    });
    return { data: [], nextCursor: null };
  }

  // Get group ids joined by user
  const { data: memberships } = await supabase
    .from("group_memberships")
    .select("group_id")
    .eq("user_id", currentUserId);
  const joinedGroupIds = (memberships || []).map((m: any) => m.group_id);

  // Filter out groups joined by user and apply date filter
  const filteredGroups = (groups || []).filter((g: any) => {
    if (joinedGroupIds.includes(g.id)) return false;
    // Date filtering: only include if ranges overlap
    if (filters.dateStart || filters.dateEnd) {
      const gStart = g.start_date ? new Date(g.start_date) : undefined;
      const gEnd = g.end_date ? new Date(g.end_date) : gStart;
      if (filters.dateStart && gEnd && gEnd < filters.dateStart) return false;
      if (filters.dateEnd && gStart && gStart > filters.dateEnd) return false;
    }
    return true;
  });

  // For each group, get member count
  const groupIds = filteredGroups.map((g: any) => g.id);
  let memberCounts: Record<string, number> = {};
  if (groupIds.length > 0) {
    const { data: membershipsData } = await supabase
      .from("group_memberships")
      .select("group_id")
      .in("group_id", groupIds);

    (membershipsData || []).forEach((m: any) => {
      memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
    });
  }

  // Fetch creator profiles for all creator_ids
  const creatorIds = filteredGroups
    .map((g: any) => g.creator_id)
    .filter(Boolean);
  let creatorProfiles: Record<
    string,
    { name: string; profile_photo?: string }
  > = {};
  if (creatorIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, profile_photo")
      .in("user_id", creatorIds);
    if (profilesError) {
      console.error("Error fetching creator profiles:", profilesError);
    }
    (profiles || []).forEach((profile: any) => {
      creatorProfiles[profile.user_id] = {
        name: profile.name || "Unknown",
        profile_photo: profile.profile_photo || undefined,
      };
    });
  }

  // Map to Group type
  const mapped = filteredGroups.map((group: any) => {
    const privacy: Group["privacy"] = group.is_public ? "public" : "private";
    return {
      id: group.id,
      name: group.name,
      privacy,
      destination: group.destination,
      dateRange: {
        start: group.start_date ? new Date(group.start_date) : new Date(),
        end: group.end_date ? new Date(group.end_date) : undefined,
        isOngoing: !group.end_date,
      },
      memberCount: memberCounts[group.id] || 0,
      userStatus: null,
      creator: {
        name: creatorProfiles[group.creator_id]?.name || "Unknown",
        avatar: creatorProfiles[group.creator_id]?.profile_photo || undefined,
      },
      created_at: group.created_at,
      cover_image: group.cover_image || undefined,
    };
  });

  const hasMore = mapped.length === limit;
  const nextCursor = hasMore
    ? mapped[mapped.length - 1]?.created_at ?? null
    : null;
  return { data: mapped, nextCursor };
};
