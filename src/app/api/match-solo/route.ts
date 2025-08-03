// -----------------------------------------------------------------------------
//   File 4: API Endpoint for Getting Solo Matches
// -----------------------------------------------------------------------------
// Location: /app/api/match-solo/route.ts
// Purpose: This is the API route your frontend will call. It uses the logic
// from the file above to find and return matches.

import { NextRequest, NextResponse } from 'next/server';
import redis from '@/lib/redis';
import { SoloSession } from '@/types';
import { calculateFinalCompatibilityScore } from '@/lib/matching/solo';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId || typeof userId !== 'string') {
            return NextResponse.json({ message: 'User ID must be a string' }, { status: 400 });
        }

        // 1. Get the searching user's session from Redis
        const searchingUserSessionJSON = await redis.get(`session:user:${userId}`);
        if (!searchingUserSessionJSON) {
            return NextResponse.json({ message: 'Active session for user not found. Please start a new search.' }, { status: 404 });
        }
        const searchingUserSession: SoloSession = JSON.parse(searchingUserSessionJSON);

        // Edge Case: Ensure the searching user's own session data is valid before proceeding
        if (!searchingUserSession.destination || !searchingUserSession.static_attributes?.location) {
            return NextResponse.json({ message: 'Your session data is incomplete. Please start a new search.' }, { status: 400 });
        }

        // 2. Get all other active session keys and fetch their data
        //
        // !!! --- PRODUCTION SCALABILITY NOTE --- !!!
        // `redis.keys()` is an O(N) operation and can be slow in databases with many keys.
        // For production, this is NOT recommended.
        // A better approach is to use Redis's Geospatial indexes. You would:
        //   a) `GEOADD` each user's destination to a sorted set when their session is created.
        //   b) Use `GEORADIUS` or `GEOSEARCH` to efficiently find all users within a certain
        //      radius of the searching user's destination.
        // This is much more performant than fetching all keys.
        //
        const allSessionKeys = (await redis.keys('session:user:*')).filter((key: string) => key !== `session:user:${userId}`);
        
        // Edge Case: Handle when there are no other active users.
        if (allSessionKeys.length === 0) {
            return NextResponse.json([]);
        }
        
        // Fetch sessions one by one to avoid type issues with mget
        const allSessions: SoloSession[] = [];
        for (const key of allSessionKeys) {
            const sessionStr = await redis.get(key);
            if (sessionStr) {
                try {
                    const session = JSON.parse(sessionStr);
                    allSessions.push(session);
                } catch (error) {
                    console.error(`Error parsing session ${key}:`, error);
                }
            }
        }

        // 3. Score all sessions and perform filtering
        const scoredMatches = allSessions
            .map(matchSession => {
                // Edge Case: Skip if a potential match has incomplete data
                if (!matchSession.destination || !matchSession.static_attributes?.location) {
                    return null;
                }

                const { score, breakdown, budgetDifference } = calculateFinalCompatibilityScore(searchingUserSession, matchSession);
                
                // Pre-filter here to avoid returning matches with insufficient date overlap
                // Note: destinationScore is never 0 due to geocoding logic - it returns at least 0.1 for far destinations
                if (breakdown.dateOverlapScore === 0) {
                    return null;
                }

                // Budget range filter: Only show matches within ±5k INR
                const budgetDiff = Math.abs(matchSession.budget - searchingUserSession.budget);
                if (budgetDiff > 5000) {
                    return null; // Skip matches with budget difference > 5k INR
                }

                return {
                    user: { // Return only public-safe info
                        userId: matchSession.userId || 'unknown',
                        ...matchSession.static_attributes
                    },
                    score,
                    destination: matchSession.destination.name || 'Unknown Destination',
                    budgetDifference,
                    breakdown // Optional: for debugging or advanced UI
                };
            })
            .filter(match => match !== null); // Remove the filtered out nulls

        // 4. Sort by score and return top 10
        const sortedMatches = scoredMatches.sort((a, b) => b!.score - a!.score);
        const topMatches = sortedMatches.slice(0, 10);

        // 5. TODO: UI Integration
        // The `topMatches` array is now ready to be sent to the frontend.
        // Each object in the array contains:
        // - `user`: An object with the matched user's public profile.
        // - `score`: The final compatibility score (0 to 1).
        // - `destination`: The name of the matched user's destination.
        // - `breakdown`: Individual scores for debugging or showing detailed match reasons.
        // Your React component on the Explore page would fetch this data and map over
        // `topMatches` to render a card for each matched user, displaying their
        // profile picture, name, age, destination, and the match score as a percentage.

        // 6. TODO: Real-time Updates with WebSockets (e.g., Socket.IO)
        // To make matching live, you would not rely solely on this API poll.
        // Instead, you would:
        //  a) Set up a WebSocket server.
        //  b) When a user's session is created or updated (in `/api/session`), the server
        //     would emit an event, e.g., `session_updated`, with the user's data.
        //  c) All connected clients would listen for this event. Upon receiving it, they
        //     could either re-run the matching logic on the client-side (for a small
        //     number of users) or trigger a re-fetch from this API.
        //  d) A more advanced approach: The server itself could run the matching logic upon a
        //     `session_updated` event and push new, personalized matches directly to the
        //     relevant clients via their unique socket ID.

        return NextResponse.json(topMatches);

    } catch (error) {
        console.error("Error in /api/match/solo:", error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
