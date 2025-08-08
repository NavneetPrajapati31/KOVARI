// -----------------------------------------------------------------------------
//   File 4: Session Creation API (FIXED for App Router)
// -----------------------------------------------------------------------------
// Location: /app/api/session/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCoordinatesForLocation } from '../../../lib/geocoding';
import { getUserProfile } from '../../../lib/supabase';
import { SoloSession, StaticAttributes } from '../../../types';
import redis from '../../../lib/redis';

// Mock user data for testing
const mockUsers = {
    'user_1': {
        age: 25,
        gender: 'female',
        personality: 'extrovert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['travel', 'photography', 'food'],
        language: 'english',
        nationality: 'indian',
        profession: 'software_engineer'
    },
    'user_2': {
        age: 28,
        gender: 'male',
        personality: 'ambivert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'agnostic',
        interests: ['travel', 'photography', 'adventure'],
        language: 'english',
        nationality: 'indian',
        profession: 'designer'
    },
    'user_3': {
        age: 30,
        gender: 'female',
        personality: 'introvert',
        location: { lat: 28.7041, lon: 77.1025 }, // Delhi
        smoking: 'no',
        drinking: 'no',
        religion: 'hindu',
        interests: ['travel', 'culture', 'history'],
        language: 'english',
        nationality: 'indian',
        profession: 'teacher'
    },
    'user_basic_test': {
        age: 25,
        gender: 'female',
        personality: 'extrovert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['travel', 'photography', 'food'],
        language: 'english',
        nationality: 'indian',
        profession: 'software_engineer'
    },
    'user_status_test': {
        age: 25,
        gender: 'female',
        personality: 'extrovert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['travel', 'photography', 'food'],
        language: 'english',
        nationality: 'indian',
        profession: 'software_engineer'
    },
    // NEW: Add test users for the fixes
    'user_test_fix_1': {
        age: 25,
        gender: 'male',
        personality: 'extrovert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['travel', 'adventure', 'food'],
        language: 'english',
        nationality: 'indian',
        profession: 'software_engineer'
    },
    'user_test_fix_2': {
        age: 28,
        gender: 'female',
        personality: 'ambivert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'christian',
        interests: ['travel', 'culture', 'photography'],
        language: 'english',
        nationality: 'indian',
        profession: 'designer'
    },
    'user_test_fix_3': {
        age: 30,
        gender: 'male',
        personality: 'introvert',
        location: { lat: 28.7041, lon: 77.1025 }, // Delhi
        smoking: 'no',
        drinking: 'no',
        religion: 'hindu',
        interests: ['travel', 'history', 'museums'],
        language: 'english',
        nationality: 'indian',
        profession: 'teacher'
    },
    'user_test_no_overlap': {
        age: 27,
        gender: 'female',
        personality: 'extrovert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['travel', 'nightlife', 'shopping'],
        language: 'english',
        nationality: 'indian',
        profession: 'marketing'
    },
    // NEW: Add real user for testing
    'user_real_test': {
        age: 25,
        gender: 'male',
        personality: 'extrovert',
        location: { lat: 28.7041, lon: 77.1025 }, // Delhi - user's home location
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['travel', 'adventure', 'food'],
        language: 'english',
        nationality: 'indian',
        profession: 'software_engineer'
    },
    'user_test_overlap': {
        age: 28,
        gender: 'female',
        personality: 'ambivert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai - different home location
        smoking: 'no',
        drinking: 'socially',
        religion: 'christian',
        interests: ['travel', 'culture', 'photography'],
        language: 'english',
        nationality: 'indian',
        profession: 'designer'
    },
    // NEW: Add August test users
    'user_august_1': {
        age: 26,
        gender: 'male',
        personality: 'extrovert',
        location: { lat: 12.9716, lon: 77.5946 }, // Bangalore
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['travel', 'adventure', 'food'],
        language: 'english',
        nationality: 'indian',
        profession: 'software_engineer'
    },
    'user_august_2': {
        age: 24,
        gender: 'female',
        personality: 'ambivert',
        location: { lat: 13.0827, lon: 80.2707 }, // Chennai
        smoking: 'no',
        drinking: 'no',
        religion: 'hindu',
        interests: ['travel', 'culture', 'photography'],
        language: 'english',
        nationality: 'indian',
        profession: 'designer'
    },
    'user_august_3': {
        age: 29,
        gender: 'male',
        personality: 'introvert',
        location: { lat: 17.3850, lon: 78.4867 }, // Hyderabad
        smoking: 'no',
        drinking: 'socially',
        religion: 'muslim',
        interests: ['travel', 'history', 'museums'],
        language: 'english',
        nationality: 'indian',
        profession: 'teacher'
    },
    'user_august_4': {
        age: 27,
        gender: 'female',
        personality: 'extrovert',
        location: { lat: 15.2993, lon: 74.1240 }, // Goa
        smoking: 'no',
        drinking: 'socially',
        religion: 'christian',
        interests: ['travel', 'beach', 'nightlife'],
        language: 'english',
        nationality: 'indian',
        profession: 'marketing'
    },
    'user_real_august': {
        age: 25,
        gender: 'male',
        personality: 'extrovert',
        location: { lat: 28.7041, lon: 77.1025 }, // Delhi - user's home location
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['travel', 'adventure', 'food'],
        language: 'english',
        nationality: 'indian',
        profession: 'software_engineer'
    }
};

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { userId, destinationName, budget, startDate, endDate } = body;

        // 1. Geocode the destination name
        const destinationCoords = await getCoordinatesForLocation(destinationName);
        if (!destinationCoords) {
            return NextResponse.json({ message: `Could not find location: ${destinationName}` }, { status: 400 });
        }

        // 2. Get user profile (either from mock data or Supabase)
        let userProfile;
        if (userId.startsWith('user_') && mockUsers[userId as keyof typeof mockUsers]) {
            // Use mock data for test users
            userProfile = mockUsers[userId as keyof typeof mockUsers];
        } else {
            // Get from Supabase for real users
            userProfile = await getUserProfile(userId);
        }

        if (!userProfile || !(userProfile as any).location) {
            return NextResponse.json({ message: 'User profile or home location not found.' }, { status: 404 });
        }

        // 3. Construct the session object
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
        // FIX: Use setEx (Redis v4+) instead of setex (deprecated)
        await redis.setEx(`session:${userId}`, 86400, JSON.stringify(sessionData));

        return NextResponse.json({ message: 'Session created successfully' }, { status: 200 });

    } catch (error) {
        console.error("Error in /api/session:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
