// -----------------------------------------------------------------------------
//   File 4: Session Creation API (FIXED for App Router)
// -----------------------------------------------------------------------------
// Location: /app/api/session/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCoordinatesForLocation } from '../../../lib/geocoding';
import { getUserProfile } from '../../../lib/supabase';
import { SoloSession, StaticAttributes } from '../../../types';
import redis from '../../../lib/redis';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, destinationName, budget, startDate, endDate } = body;

        // 1. Geocode the destination name
        const destinationCoords = await getCoordinatesForLocation(destinationName);
        if (!destinationCoords) {
            return NextResponse.json({ message: `Could not find location: ${destinationName}` }, { status: 400 });
        }

        // 2. Fetch user profile (assuming it already has lat/lon for home location)
        const userProfile = await getUserProfile(userId);
        // FIX: The error indicates 'location' is not on the UserProfile type.
        // We must check for it dynamically on the returned object, not the type.
        if (!userProfile || !(userProfile as any).location) {
            return NextResponse.json({ message: 'User profile or home location not found.' }, { status: 404 });
        }

        // 3. Construct the session object
        // FIX: Manually build the staticAttributes object to avoid type errors from destructuring.
        // This is safer if the UserProfile type from the DB doesn't perfectly match our needs.
        const staticAttributes: StaticAttributes = {
            age: (userProfile as any).age,
            gender: (userProfile as any).gender,
            personality: (userProfile as any).personality,
            location: (userProfile as any).location,
            smoking: (userProfile as any).smoking,
            drinking: (userProfile as any).drinking,
            religion: (userProfile as any).religion,
            interests: (userProfile as any).interests,
            language: (userProfile as any).language,
            nationality: (userProfile as any).nationality,
            profession: (userProfile as any).profession,
        };

        const sessionData: SoloSession = {
            userId,
            destination: { name: destinationName, ...destinationCoords },
            budget: Number(budget),
            startDate,
            endDate,
            mode: 'solo',
            static_attributes: staticAttributes,
        };

        // 4. Store in Redis
        await redis.setex(`session:${userId}`, 86400, JSON.stringify(sessionData));

        return NextResponse.json({ message: 'Session created successfully' }, { status: 200 });

    } catch (error) {
        console.error("Error in /api/session:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
