import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { getCoordinatesForLocation, createAdminSupabaseClient } from "@kovari/api";
import { getGeminiPlaceOverview } from "@/lib/gemini";
import { generateRequestId } from "@/lib/api/requestId";
import { formatStandardResponse, formatErrorResponse } from "@/lib/api/responseHelpers";
import { ApiErrorCode } from "@/types/api";

// --- Schema validation matching web's create-group ---
const GroupSchema = z.object({
  name: z.string().min(3),
  destination: z.string().min(2),
  destination_details: z.any().optional(),
  start_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  end_date: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  is_public: z.boolean(),
  description: z.string().max(500).optional().nullable(),
  cover_image: z.string().optional().nullable(),
  non_smokers: z.boolean().optional().nullable(),
  non_drinkers: z.boolean().optional().nullable(),
  budget: z.number().optional().nullable(),
});

/**
 * GET /api/mobile/groups
 * Fetch groups joined by the current mobile user with high-fidelity parity to web.
 */
export async function GET(req: NextRequest) {
  const start = Date.now();
  const requestId = generateRequestId();

  const authUser = await getAuthenticatedUser(req);
  if (!authUser) {
    return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);
  }

  const userId = authUser.id; // internal Supabase UUID
  const supabase = createAdminSupabaseClient();

  try {
    // 1. Fetch memberships where status is 'accepted'
    const { data: memberships, error: membershipError } = await supabase
      .from("group_memberships")
      .select("group_id")
      .eq("user_id", userId)
      .eq("status", "accepted");

    if (membershipError) {
      console.error("Error fetching group memberships:", membershipError);
      return formatErrorResponse("Database error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }

    const groupIds = memberships.map((m) => m.group_id);

    if (groupIds.length === 0) {
      return formatStandardResponse([], {}, { requestId, latencyMs: Date.now() - start });
    }

    // 2. Fetch the groups with those IDs
    const { data: groupsData, error: groupsError } = await supabase
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
        status
      `)
      .in("id", groupIds)
      .in("status", ["active", "pending"])
      .neq("status", "removed")
      .order("created_at", { ascending: false });

    if (groupsError) {
      console.error("Error fetching groups:", groupsError);
      return formatErrorResponse("Database error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
    }

    if (!groupsData || groupsData.length === 0) {
      return formatStandardResponse([], {}, { requestId, latencyMs: Date.now() - start });
    }

    // 3. Fetch additional data for mapping (Creator profiles)
    const creatorIds = [...new Set(groupsData.map((g) => g.creator_id))];
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id, name, username, profile_photo")
      .in("user_id", creatorIds);

    if (profilesError) {
      console.error("Error fetching creator profiles:", profilesError);
    }

    const profilesMap = (profilesData || []).reduce((acc: any, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {});

    // 4. Map data to the interface mobile expects
    const mappedGroups = groupsData.map((group) => {
      const creator = profilesMap[group.creator_id];
      return {
        id: group.id,
        name: group.name,
        privacy: group.is_public ? "public" : "private",
        destination: group.destination,
        dateRange: {
          start: group.start_date,
          end: group.end_date,
          isOngoing: !group.end_date,
        },
        memberCount: group.members_count || 0,
        userStatus: "member", // User is always a member in this context
        creator: {
          name: creator?.name || "Unknown",
          username: creator?.username || "unknown",
          avatar: creator?.profile_photo,
        },
        creatorId: group.creator_id,
        created_at: group.created_at,
        cover_image: group.cover_image,
        status: group.status,
      };
    });

    return formatStandardResponse(mappedGroups, {}, { requestId, latencyMs: Date.now() - start });
  } catch (error: any) {
    console.error("Unexpected error in GET /api/mobile/groups:", error);
    return formatErrorResponse("Internal server error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}

/**
 * POST /api/mobile/groups
 * Creates a new travel group from mobile application.
 * Unified authentication via Mobile JWT or Clerk.
 */
export async function POST(req: NextRequest) {
  const start = Date.now();
  const requestId = generateRequestId();

  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return formatErrorResponse("Unauthorized", ApiErrorCode.UNAUTHORIZED, requestId, 401);
    }

    const userId = authUser.id; // internal Supabase UUID
    const body = await req.json();
    const parsed = GroupSchema.safeParse(body);

    if (!parsed.success) {
      return formatErrorResponse("Validation failed", ApiErrorCode.BAD_REQUEST, requestId, 400, parsed.error.flatten());
    }

    const supabase = createAdminSupabaseClient();

    // 1. Fetch creator's profile for dominant languages
    const { data: creatorProfile } = await supabase
      .from("profiles")
      .select("languages")
      .eq("user_id", userId)
      .single();

    const creatorLanguages = creatorProfile?.languages || ["English"];

    // 2. Geocode destination if coords missing (parity with web)
    let destLat = parsed.data.destination_details?.latitude ?? null;
    let destLon = parsed.data.destination_details?.longitude ?? null;
    if ((destLat == null || destLon == null) && parsed.data.destination) {
      const coords = await getCoordinatesForLocation(parsed.data.destination);
      if (coords) {
        destLat = coords.lat;
        destLon = coords.lon;
      }
    }

    // 3. Prepare Group insertion payload
    const payload = {
      creator_id: userId,
      ...parsed.data,
      destination_details: parsed.data.destination_details || null,
      destination_lat: destLat,
      destination_lon: destLon,
      cover_image: parsed.data.cover_image || null,
      non_smokers: parsed.data.non_smokers ?? null,
      non_drinkers: parsed.data.non_drinkers ?? null,
      status: "pending", // All new groups require admin review
      dominant_languages: creatorLanguages,
    };

    const { data: groupData, error: insertError } = await supabase
      .from("groups")
      .insert(payload)
      .select()
      .single();

    if (insertError) {
      console.error("Mobile group insert failure:", insertError);
      return formatErrorResponse("Failed to create group", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500, insertError.message);
    }

    // 4. Background Enrichment: Gemini AI Overview
    if (parsed.data.destination && !groupData.ai_overview) {
      getGeminiPlaceOverview(parsed.data.destination).then(async (overview) => {
        if (overview) {
          await supabase
            .from("groups")
            .update({ ai_overview: overview })
            .eq("id", groupData.id);
        }
      }).catch(err => console.error("Gemini failed:", err));
    }

    // 5. Automatic Creator Membership
    const { error: membershipError } = await supabase
      .from("group_memberships")
      .insert({
        group_id: groupData.id,
        user_id: userId,
        status: "accepted",
        role: "admin",
      });

    if (membershipError) {
      // Rollback group if membership fails
      await supabase.from("groups").delete().eq("id", groupData.id);
      return formatErrorResponse("Failed to establish group membership", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500, membershipError.message);
    }

    // 6. Fetch creator's profile for the enriched response
    const { data: creator } = await supabase
      .from("profiles")
      .select("name, username, profile_photo")
      .eq("user_id", userId)
      .single();

    // 7. Map to mobile Group interface
    const mappedGroup = {
      id: groupData.id,
      name: groupData.name,
      privacy: groupData.is_public ? "public" : "private",
      destination: groupData.destination,
      dateRange: {
        start: groupData.start_date,
        end: groupData.end_date,
        isOngoing: !groupData.end_date,
      },
      memberCount: 1, // Creator is the first member
      userStatus: "member",
      creator: {
        name: creator?.name || "Unknown",
        username: creator?.username || "unknown",
        avatar: creator?.profile_photo,
      },
      creatorId: userId,
      created_at: groupData.created_at,
      cover_image: groupData.cover_image,
      status: groupData.status,
    };

    return formatStandardResponse(mappedGroup, {}, { requestId, latencyMs: Date.now() - start }, 201);

  } catch (error: any) {
    console.error("Critical error in POST /api/mobile/groups:", error);
    return formatErrorResponse("Internal server error", ApiErrorCode.INTERNAL_SERVER_ERROR, requestId, 500);
  }
}
