import { createClient } from "@/lib/supabase";

// Traveler type for TravelerCard
export interface Traveler {
  id: string;
  userId: string;
  name: string;
  username: string;
  age: number;
  bio: string;
  profilePhoto: string;
  destination: string;
  travelDates: string;
  matchStrength: "high" | "medium" | "low";
  created_at: string;
  isFollowing: boolean;
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
  userStatus:
    | "member"
    | "pending"
    | "pending_request"
    | "blocked"
    | "declined"
    | null;
  creator: {
    name: string;
    username: string;
    avatar?: string;
  };
  creatorId: string;
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
      (profile: any) => profile.user_id !== currentUserId
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

    // Fetch following info for current user
    let followingIds = new Set<string>();
    if (userIds.length > 0) {
      const { data: followingRows, error: followingError } = await supabase
        .from("user_follows")
        .select("following_id")
        .eq("follower_id", currentUserId)
        .in("following_id", userIds);
      if (followingError) {
        console.error("Error fetching following info:", followingError);
      }
      followingIds = new Set(
        (followingRows || []).map((row: any) => row.following_id)
      );
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
          userId: profile.user_id,
          name: profile.name || "",
          username: profile.username || "",
          age: profile.age || 0,
          bio: profile.bio || "",
          profilePhoto: profile.profile_photo || "",
          destination,
          travelDates: formatDateRange(startDate, endDate),
          matchStrength: "medium" as const,
          created_at: profile.created_at,
          isFollowing: followingIds.has(profile.user_id),
        };
      })
      .filter(Boolean);

    const hasMore = mapped.length === limit;
    const nextCursor = hasMore
      ? (mapped[mapped.length - 1]?.created_at ?? null)
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

  // Get group membership status for the user for all groups
  const groupIds = (groups || []).map((g: any) => g.id);
  let userMemberships: Record<string, string> = {};
  if (groupIds.length > 0 && currentUserId) {
    let internalUserId = currentUserId;
    if (currentUserId.length !== 36) {
      // Looks like a Clerk user ID, map to internal UUID
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", currentUserId)
        .single();
      if (userData?.id) internalUserId = userData.id;
    }
    if (internalUserId && internalUserId.length === 36) {
      const { data: memberships } = await supabase
        .from("group_memberships")
        .select("group_id, status")
        .eq("user_id", internalUserId)
        .in("group_id", groupIds);
      (memberships || []).forEach((m: any) => {
        userMemberships[m.group_id] = m.status;
      });
    }
  }

  // For each group, get member count
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
  const creatorIds = (groups || [])
    .map((g: any) => g.creator_id)
    .filter(Boolean);
  let creatorProfiles: Record<
    string,
    { name: string; username: string; profile_photo?: string }
  > = {};
  if (creatorIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, username, profile_photo")
      .in("user_id", creatorIds);
    if (profilesError) {
      console.error("Error fetching creator profiles:", profilesError);
    }
    (profiles || []).forEach((profile: any) => {
      creatorProfiles[profile.user_id] = {
        name: profile.name || "Unknown",
        username: profile.username || "unknown",
        profile_photo: profile.profile_photo || undefined,
      };
    });
  }

  // Map to Group type
  const mapped = (groups || []).map((group: any) => {
    const privacy: Group["privacy"] = group.is_public ? "public" : "private";
    let userStatus: Group["userStatus"] = null;
    const membershipStatus = userMemberships[group.id];
    if (membershipStatus === "accepted") userStatus = "member";
    else if (membershipStatus === "pending") userStatus = "pending";
    else if (membershipStatus === "pending_request")
      userStatus = "pending_request";
    else if (membershipStatus === "declined") userStatus = "declined";
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
      userStatus,
      creator: {
        name: creatorProfiles[group.creator_id]?.name || "Unknown",
        username: creatorProfiles[group.creator_id]?.username || "unknown",
        avatar: creatorProfiles[group.creator_id]?.profile_photo || undefined,
      },
      creatorId: group.creator_id,
      created_at: group.created_at,
      cover_image: group.cover_image || undefined,
    };
  });

  const hasMore = mapped.length === limit;
  const nextCursor = hasMore
    ? (mapped[mapped.length - 1]?.created_at ?? null)
    : null;
  return { data: mapped, nextCursor };
};

/**
 * Fetch groups joined by the current user.
 */
export const fetchMyGroups = async (
  clerkUserId: string,
  limit: number = 20
): Promise<{ data: Group[]; nextCursor: string | null }> => {
  const supabase = createClient();

  // 1. Get the internal Supabase user_id from the clerk_user_id.
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", clerkUserId)
    .single();

  if (userError || !userData) {
    console.error("Error fetching user:", userError);
    return { data: [], nextCursor: null };
  }
  const internalUserId = userData.id;

  // 2. Get the group_ids for the user where membership is 'accepted'.
  const { data: memberships, error: membershipError } = await supabase
    .from("group_memberships")
    .select("group_id")
    .eq("user_id", internalUserId)
    .eq("status", "accepted");

  if (membershipError) {
    console.error("Error fetching group memberships:", membershipError);
    return { data: [], nextCursor: null };
  }

  const groupIds = memberships.map((m) => m.group_id);

  if (groupIds.length === 0) {
    return { data: [], nextCursor: null };
  }

  // 3. Fetch the groups with those IDs.
  const { data: groupsData, error: groupsError } = await supabase
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
    .in("id", groupIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (groupsError) {
    console.error("Error fetching groups:", groupsError);
    return { data: [], nextCursor: null };
  }

  if (!groupsData) {
    return { data: [], nextCursor: null };
  }

  // 4. Fetch additional data for mapping
  const creatorIds = [...new Set(groupsData.map((g) => g.creator_id))];
  const allGroupIds = groupsData.map((g) => g.id);

  const [
    { data: profilesData, error: profilesError },
    { data: memberCountsData, error: countsError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("user_id, name, username, profile_photo")
      .in("user_id", creatorIds),
    supabase
      .from("group_memberships")
      .select("group_id")
      .in("group_id", allGroupIds)
      .eq("status", "accepted"),
  ]);

  if (profilesError) {
    console.error("Error fetching creator profiles:", profilesError);
  }
  if (countsError) {
    console.error("Error fetching member counts:", countsError);
  }

  const profilesMap = (profilesData || []).reduce((acc: any, profile) => {
    acc[profile.user_id] = profile;
    return acc;
  }, {});

  const memberCountMap = (memberCountsData || []).reduce((acc: any, gm) => {
    acc[gm.group_id] = (acc[gm.group_id] || 0) + 1;
    return acc;
  }, {});

  // 5. Map data to Group interface
  const mappedGroups: Group[] = groupsData.map((group) => {
    const creator = profilesMap[group.creator_id];
    return {
      id: group.id,
      name: group.name,
      privacy: group.is_public ? "public" : "private",
      destination: group.destination,
      dateRange: {
        start: new Date(group.start_date),
        end: group.end_date ? new Date(group.end_date) : undefined,
        isOngoing: !group.end_date,
      },
      memberCount: memberCountMap[group.id] || 0,
      userStatus: "member", // User is always a member in "My Groups"
      creator: {
        name: creator?.name || "Unknown",
        username: creator?.username || "unknown",
        avatar: creator?.profile_photo,
      },
      creatorId: group.creator_id,
      created_at: group.created_at,
      cover_image: group.cover_image,
    };
  });

  const nextCursor =
    mappedGroups.length === limit
      ? mappedGroups[mappedGroups.length - 1].id
      : null;

  return { data: mappedGroups, nextCursor };
};
