// -----------------------------------------------------------------------------
//   File 3: Session Creation API (Updated to use Geocoding)
// -----------------------------------------------------------------------------
// Location: /app/api/session/route.ts

import { NextRequest, NextResponse } from "next/server";
import redis from "@/lib/redis";
import { getCoordinatesForLocation } from "@/lib/geocoding";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase";
import { SoloSession, StaticAttributes } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const { userId, destinationName, budget, startDate, endDate } = await req.json();

    if (!userId || !destinationName || !budget || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Geocode the destination name
    const destinationCoords = await getCoordinatesForLocation(destinationName);
    if (!destinationCoords) {
      return NextResponse.json({ error: `Could not find location: ${destinationName}` }, { status: 400 });
    }

    // 2. Fetch user profile from Supabase
    const supabase = createRouteHandlerSupabaseClient();
    const { data: userProfile, error: profileError } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    // 3. Construct the session object with proper static attributes
    const sessionData: SoloSession = {
      userId,
      destination: { 
        name: destinationName, 
        lat: destinationCoords.lat, 
        lon: destinationCoords.lon 
      },
      budget,
      startDate,
      endDate,
      mode: 'solo',
      static_attributes: {
        age: userProfile.age || 25,
        gender: userProfile.gender || "prefer_not_to_say",
        personality: userProfile.personality || "ambivert",
        location: {
          lat: userProfile.latitude || 0, // Get from user profile if available
          lon: userProfile.longitude || 0
        },
        smoking: userProfile.smoking || false,
        drinking: userProfile.drinking || false,
        religion: userProfile.religion || "agnostic",
        interests: userProfile.interests || [],
        language: userProfile.languages || ["english"],
        nationality: userProfile.nationality || "Unknown",
        profession: userProfile.profession || "student"
      }
    };

    // 4. Store in Redis with 24-hour expiry
    await redis.setex(`session:user:${userId}`, 86400, JSON.stringify(sessionData));

    return NextResponse.json({ 
      success: true, 
      message: "Session created successfully",
      session: sessionData
    });

  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const sessionStr = await redis.get(`session:user:${userId}`);
    if (!sessionStr) {
      return NextResponse.json({ error: "No active session found" }, { status: 404 });
    }

    const sessionData = JSON.parse(sessionStr);
    return NextResponse.json({ session: sessionData });
  } catch (error) {
    console.error("Error retrieving session:", error);
    return NextResponse.json({ error: "Failed to retrieve session" }, { status: 500 });
  }
}
