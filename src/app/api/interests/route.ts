
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

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

    // Fetch sender profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("user_id, name, username, profile_photo, bio")
      .in("user_id", senderIds);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      // We continue, but some profile info might be missing
    }

    const profileMap = (profiles || []).reduce((acc: any, profile) => {
      acc[profile.user_id] = profile;
      return acc;
    }, {});

    // Transform data to match the UI component requirements
    const formattedInterests = interests.map((interest: any) => {
      const sender = profileMap[interest.from_user_id] || {};
      return {
        id: interest.id,
        sender: {
          id: interest.from_user_id,
          name: sender.name || "Unknown User",
          username: sender.username || "traveler",
          avatar: sender.profile_photo || "",
          bio: sender.bio || "",
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
