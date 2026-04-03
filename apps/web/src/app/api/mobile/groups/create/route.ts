import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUser } from "@/lib/auth/get-user";
import { getCoordinatesForLocation, createAdminSupabaseClient } from "@kovari/api";
import { getGeminiPlaceOverview } from "@/lib/gemini";

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
});

/**
 * POST /api/mobile/groups/create
 * Creates a new travel group from mobile application.
 * Unified authentication via Mobile JWT or Clerk.
 */
export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = authUser.id; // internal Supabase UUID
    const body = await req.json();
    const parsed = GroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Failed to create group", details: insertError.message },
        { status: 500 }
      );
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
      return NextResponse.json(
        { error: "Failed to establish group membership", details: membershipError.message },
        { status: 500 }
      );
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

    return NextResponse.json(mappedGroup, { status: 201 });

  } catch (error: any) {
    console.error("Critical error in POST /api/mobile/groups/create:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
