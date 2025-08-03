// -----------------------------------------------------------------------------
//   File 4: API Endpoint for Getting Solo Matches (FIXED for App Router)
// -----------------------------------------------------------------------------
// Location: /app/api/match-solo/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { calculateFinalCompatibilityScore } from '../../../lib/matching/solo';
import { SoloSession } from '../../../types';
// FIX: Add missing import for redis client
import redis from '../../../lib/redis';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }

        // 1. Get the searching user's session from Redis
        const searchingUserSessionJSON = await redis.get(`session:${userId}`);
        if (!searchingUserSessionJSON) {
            return NextResponse.json({ message: 'Active session for user not found. Please start a new search.' }, { status: 404 });
        }
        const searchingUserSession: SoloSession = JSON.parse(searchingUserSessionJSON);

        // Edge Case: Ensure the searching user's own session data is valid before proceeding
        if (!searchingUserSession.destination || !searchingUserSession.static_attributes?.location) {
            return NextResponse.json({ message: 'Your session data is incomplete. Please start a new search.' }, { status: 400 });
        }

        // 2. Get all other active session keys and fetch their data
        const allSessionKeys = (await redis.keys('session:*')).filter(key => key !== `session:${userId}`);
        
        if (allSessionKeys.length === 0) {
            return NextResponse.json([], { status: 200 });
        }
        const allSessionsJSON = await redis.mget(allSessionKeys);

        // FIX: Check if allSessionsJSON is not null and is an array before proceeding.
        if (!allSessionsJSON || !Array.isArray(allSessionsJSON)) {
            return NextResponse.json([], { status: 200 }); // Return empty if no valid sessions found
        }

        // FIX: Use a type predicate `s is string` in the filter to correctly inform
        // TypeScript that the resulting array only contains strings. This resolves all
        // subsequent type errors in the chain.
        const validSessionsJSON = allSessionsJSON.filter((s): s is string => s !== null);

        const allSessions: SoloSession[] = validSessionsJSON.map((s: string) => JSON.parse(s));

        // 3. Score all sessions and perform filtering
        const scoredMatches = allSessions
            .map(matchSession => {
                if (!matchSession.destination || !matchSession.static_attributes?.location) {
                    return null;
                }
                const { score, breakdown } = calculateFinalCompatibilityScore(searchingUserSession, matchSession);
                if (breakdown.destinationScore === 0 || breakdown.dateOverlapScore === 0) {
                    return null;
                }
                return {
                    user: { userId: matchSession.userId, ...matchSession.static_attributes },
                    score,
                    destination: matchSession.destination.name,
                    breakdown
                };
            })
            .filter(match => match !== null);

        // 4. Sort by score and return top 10
        const sortedMatches = scoredMatches.sort((a, b) => b!.score - a!.score);
        const topMatches = sortedMatches.slice(0, 10);

        return NextResponse.json(topMatches, { status: 200 });

    } catch (error) {
        console.error("Error in /api/match-solo:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
