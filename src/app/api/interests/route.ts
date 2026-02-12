import { NextResponse } from "next/server";
import { createAdminSupabaseClient } from "@/lib/supabase-admin";
import { auth } from "@clerk/nextjs/server";


export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user's UUID from their Clerk ID
    const supabaseAdmin = createAdminSupabaseClient();
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("clerk_user_id", clerkUserId)
      .single();

    if (userError || !userData) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const userId = userData.id;

    // Fetch incoming interests ('solo' type)
    // We want interests where to_user_id = current user
    const { data: interests, error: interestsError } = await supabaseAdmin
      .from("match_interests")
      .select("id, created_at, destination_id, status, match_type, from_user_id")
      .eq("to_user_id", userId)
      .eq("match_type", "solo")
      .eq("status", "pending") // Only show pending requests
      .order("created_at", { ascending: false });

    if (interestsError) {
      console.error("Error fetching interests:", interestsError);
      return NextResponse.json(
        { error: "Failed to fetch interests" },
        { status: 500 }
      );
    }

    if (!interests || interests.length === 0) {
      return NextResponse.json([]);
    }

    // Collect sender IDs
    const senderIds = [...new Set(interests.map((i) => i.from_user_id))];

    // Fetch sender profiles with location
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, username, profile_photo, bio, location")
      .in("user_id", senderIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      // We continue, but some profile info might be missing
    }

    const profileMap = (profiles || []).reduce((acc: any, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {});

    // Calculate mutual connections for each sender
    // Mutual connections = users who have matches with both current user and sender
    const mutualConnectionsMap: Record<string, number> = {};
    
    for (const senderId of senderIds) {
      try {
        // Get all matches for current user
        const { data: currentUserMatches } = await supabaseAdmin
          .from("matches")
          .select("user_a_id, user_b_id")
          .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`)
          .eq("status", "active");

        // Get all matches for sender
        const { data: senderMatches } = await supabaseAdmin
          .from("matches")
          .select("user_a_id, user_b_id")
          .or(`user_a_id.eq.${senderId},user_b_id.eq.${senderId}`)
          .eq("status", "active");

        if (currentUserMatches && senderMatches) {
          // Extract connected user IDs for current user
          const currentUserConnections = new Set<string>();
          currentUserMatches.forEach((match) => {
            if (match.user_a_id !== userId) currentUserConnections.add(match.user_a_id);
            if (match.user_b_id !== userId) currentUserConnections.add(match.user_b_id);
          });

          // Extract connected user IDs for sender
          const senderConnections = new Set<string>();
          senderMatches.forEach((match) => {
            if (match.user_a_id !== senderId) senderConnections.add(match.user_a_id);
            if (match.user_b_id !== senderId) senderConnections.add(match.user_b_id);
          });

          // Find intersection (mutual connections)
          const mutual = [...currentUserConnections].filter((id) =>
            senderConnections.has(id)
          );
          mutualConnectionsMap[senderId] = mutual.length;
        } else {
          mutualConnectionsMap[senderId] = 0;
        }
      } catch (error) {
        console.error(`Error calculating mutual connections for ${senderId}:`, error);
        mutualConnectionsMap[senderId] = 0;
      }
    }

    // Transform data to match the UI component requirements
    const formattedInterests = interests.map((interest: any) => {
      const sender = profileMap[interest.from_user_id] || {};
      // Use destination_id as the location (this is where they want to travel to)
      const destinationLocation = interest.destination_id || "Unknown Destination";

      return {
        id: interest.id,
        sender: {
          id: interest.from_user_id,
          name: sender.name || "Unknown User",
          username: sender.username || "traveler",
          avatar: sender.profile_photo || "",
          bio: sender.bio || "",
          location: destinationLocation, // Show destination they're interested in, not their home location
          mutualConnections: mutualConnectionsMap[interest.from_user_id] || 0,
        },
        destination: interest.destination_id, 
        sentAt: interest.created_at,
        status: interest.status,
      };
    });

    return NextResponse.json(formattedInterests);
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
