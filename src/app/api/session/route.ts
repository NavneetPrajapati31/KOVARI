// -----------------------------------------------------------------------------
//   File 4: Session Creation API (FIXED for App Router)
// -----------------------------------------------------------------------------
// Location: /app/api/session/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getCoordinatesForLocation } from '../../../lib/geocoding';
import { getUserProfile } from '../../../lib/supabase';
import { SoloSession, StaticAttributes } from '../../../types';
import redis, { ensureRedisConnection } from '../../../lib/redis';

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
    },
    // Test users for Mumbai solo matching - all traveling TO Mumbai from different cities
    'user_mumbai_1': {
        age: 28,
        gender: 'female',
        personality: 'ambivert',
        location: { lat: 28.7041, lon: 77.1025 }, // Delhi - traveling TO Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'christian',
        interests: ['culture', 'photography', 'art'],
        language: 'english',
        languages: ['english', 'hindi'],
        nationality: 'indian',
        profession: 'ui_ux_designer',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
    },
    'user_mumbai_2': {
        age: 30,
        gender: 'male',
        personality: 'introvert',
        location: { lat: 12.9716, lon: 77.5946 }, // Bangalore - traveling TO Mumbai
        smoking: 'no',
        drinking: 'no',
        religion: 'hindu',
        interests: ['history', 'culture', 'architecture'],
        language: 'english',
        languages: ['english', 'hindi', 'kannada'],
        nationality: 'indian',
        profession: 'history_teacher',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    'user_mumbai_3': {
        age: 26,
        gender: 'female',
        personality: 'extrovert',
        location: { lat: 13.0827, lon: 80.2707 }, // Chennai - traveling TO Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['food', 'nightlife', 'shopping'],
        language: 'english',
        languages: ['english', 'hindi', 'tamil'],
        nationality: 'indian',
        profession: 'marketing_manager',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    'user_mumbai_4': {
        age: 27,
        gender: 'male',
        personality: 'ambivert',
        location: { lat: 17.3850, lon: 78.4867 }, // Hyderabad - traveling TO Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'agnostic',
        interests: ['nature', 'photography', 'hiking'],
        language: 'english',
        languages: ['english', 'hindi', 'telugu'],
        nationality: 'indian',
        profession: 'full_stack_developer',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    'user_mumbai_5': {
        age: 29,
        gender: 'female',
        personality: 'introvert',
        location: { lat: 15.2993, lon: 74.1240 }, // Goa - traveling TO Mumbai
        smoking: 'no',
        drinking: 'no',
        religion: 'christian',
        interests: ['architecture', 'art', 'design'],
        language: 'english',
        languages: ['english', 'hindi', 'konkani'],
        nationality: 'indian',
        profession: 'architect',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face'
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

        // 3. Construct the session object - ONLY dynamic attributes in Redis
        const sessionData: SoloSession = {
            userId,
            destination: { name: destinationName, ...destinationCoords },
            budget: Number(budget),
            startDate,
            endDate,
            mode: 'solo',
            interests: (userProfile as any).interests || ['travel', 'exploration'],
            // NO static_attributes here - they come from Supabase when needed
        };

        // 4. Store in Redis with 7-day expiration
        const redisClient = await ensureRedisConnection();
        await redisClient.setEx(`session:${userId}`, 604800, JSON.stringify(sessionData)); // 7 days

        return NextResponse.json({ message: 'Session created successfully' }, { status: 200 });

    } catch (error) {
        console.error("Error in /api/session:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
