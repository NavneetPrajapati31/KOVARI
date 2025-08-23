// -----------------------------------------------------------------------------
//   File 4: API Endpoint for Getting Solo Matches (FIXED for App Router)
// -----------------------------------------------------------------------------
// Location: /app/api/match-solo/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { calculateFinalCompatibilityScore, isCompatibleMatch } from '../../../lib/matching/solo';
import { SoloSession } from '../../../types';
// FIX: Add missing import for redis client
import redis from '../../../lib/redis';
import { createRouteHandlerSupabaseClient } from '../../../lib/supabase';

// Helper: get interests from travel_preferences by Clerk user id (fallback)
const getTravelInterestsByClerkId = async (clerkUserId: string): Promise<string[]> => {
    try {
        const supabase = createRouteHandlerSupabaseClient();
        const { data: userRow, error: userErr } = await supabase
            .from('users')
            .select('id')
            .eq('clerk_user_id', clerkUserId)
            .single();
        if (userErr || !userRow) {
            return [];
        }
        const { data: prefsRow, error: prefsErr } = await supabase
            .from('travel_preferences')
            .select('interests')
            .eq('user_id', userRow.id)
            .single();
        if (prefsErr || !prefsRow) {
            return [];
        }
        return Array.isArray(prefsRow.interests) ? prefsRow.interests as string[] : [];
    } catch {
        return [];
    }
};

const computeCommonInterests = (a?: string[], b?: string[]): string[] => {
    const norm = (arr?: string[]) => (arr || []).map(s => String(s).trim().toLowerCase()).filter(Boolean);
    const aNorm = norm(a);
    const bNorm = norm(b);
    if (aNorm.length === 0 || bNorm.length === 0) return [];
    const bSet = new Set(bNorm);
    const common = Array.from(new Set(aNorm.filter(x => bSet.has(x))));
    return common;
};

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        console.log(`🔍 Match-solo request for userId: ${userId}`);

        if (!userId) {
            return NextResponse.json({ message: 'User ID is required' }, { status: 400 });
        }

        // 1. Get the searching user's session from Redis
        console.log(`🔍 Getting session for user: ${userId}`);
        const searchingUserSessionJSON = await redis.get(`session:${userId}`);
        if (!searchingUserSessionJSON) {
            console.log(`❌ No session found for user: ${userId}`);
            return NextResponse.json({ message: 'Active session for user not found. Please start a new search.' }, { status: 404 });
        }
        
        console.log(`✅ Session found for user: ${userId}`);
        const searchingUserSession: SoloSession = JSON.parse(searchingUserSessionJSON);

        // Edge Case: Ensure the searching user's own session data is valid before proceeding
        if (!searchingUserSession.destination || !searchingUserSession.static_attributes?.location) {
            console.log(`❌ Invalid session data for user: ${userId}`);
            return NextResponse.json({ message: 'Your session data is incomplete. Please start a new search.' }, { status: 400 });
        }

        // 2. Get all other active session keys and fetch their data
        console.log(`🔍 Getting all session keys...`);
        const allSessionKeys = (await redis.keys('session:*')).filter(key => key !== `session:${userId}`);
        console.log(`✅ Found ${allSessionKeys.length} other sessions`);
        
        if (allSessionKeys.length === 0) {
            console.log(`ℹ️ No other sessions found`);
            return NextResponse.json([], { status: 200 });
        }
        
        console.log(`🔍 Getting session data for ${allSessionKeys.length} sessions...`);
        const allSessionsJSON = await redis.mGet(allSessionKeys);

        // FIX: Check if allSessionsJSON is not null and is an array before proceeding.
        if (!allSessionsJSON || !Array.isArray(allSessionsJSON)) {
            console.log(`❌ Invalid session data returned from Redis`);
            return NextResponse.json([], { status: 200 }); // Return empty if no valid sessions found
        }

        // FIX: Use a type predicate `s is string` in the filter to correctly inform
        // TypeScript that the resulting array only contains strings. This resolves all
        // subsequent type errors in the chain.
        const validSessionsJSON = allSessionsJSON.filter((s): s is string => s !== null);
        console.log(`✅ Found ${validSessionsJSON.length} valid sessions`);

        const allSessions: SoloSession[] = validSessionsJSON.map((s: string) => JSON.parse(s));

        // 3. Score all sessions and perform filtering with enhanced compatibility check
        console.log(`🔍 Calculating compatibility scores...`);
        const scoredMatches = (await Promise.all(allSessions.map(async (matchSession) => {
            if (!matchSession.destination || !matchSession.static_attributes?.location) {
                return null;
            }
            // NEW: Use enhanced compatibility check
            if (!isCompatibleMatch(searchingUserSession, matchSession)) {
                return null;
            }

            const { score, breakdown, budgetDifference } = calculateFinalCompatibilityScore(searchingUserSession, matchSession);
            // Only include matches with reasonable scores (above 0.1)
            if (score < 0.1) {
                return null;
            }

            // Compute common interests (fallback to travel_preferences if not in session)
            const searchingInterests = searchingUserSession.static_attributes?.interests;
            const matchInterests = matchSession.static_attributes?.interests;
            const resolvedSearchingInterests = (searchingInterests && searchingInterests.length > 0)
                ? searchingInterests
                : (searchingUserSession.userId ? await getTravelInterestsByClerkId(searchingUserSession.userId) : []);
            const resolvedMatchInterests = (matchInterests && matchInterests.length > 0)
                ? matchInterests
                : (matchSession.userId ? await getTravelInterestsByClerkId(matchSession.userId) : []);
            const commonInterests = computeCommonInterests(resolvedSearchingInterests, resolvedMatchInterests);

            return {
                user: {
                    userId: matchSession.userId,
                    budget: matchSession.budget,
                    ...matchSession.static_attributes
                },
                score,
                destination: matchSession.destination.name,
                breakdown,
                budgetDifference,
                commonInterests,
            };
        }))).filter(match => match !== null);

        // 4. Sort by score and return top 10
        console.log(`✅ Found ${scoredMatches.length} compatible matches`);
        const sortedMatches = scoredMatches.sort((a, b) => b!.score - a!.score);
        const topMatches = sortedMatches.slice(0, 10);

        console.log(`✅ Returning ${topMatches.length} top matches`);
        return NextResponse.json(topMatches, { status: 200 });

    } catch (error) {
        console.error("Error in /api/match-solo:", error);
        console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
