import { NextResponse } from 'next/server';
import redis from '../../../../lib/redis';

export async function GET() {
    try {
        // Get all session keys
        const sessionKeys = await redis.keys('session:*');
        
        if (sessionKeys.length === 0) {
            return NextResponse.json([]);
        }
        
        // Get all session data
        const sessionsData = await redis.mGet(sessionKeys);
        
        // Parse and return session data
        const sessions = (sessionsData as (string | null)[])
            .filter((data): data is string => data !== null)
            .map((data: string) => {
                try {
                    return JSON.parse(data);
                } catch (error) {
                    console.error('Error parsing session data:', error);
                    return null;
                }
            })
            .filter((session): session is any => session !== null);
        
        return NextResponse.json(sessions);
        
    } catch (error) {
        console.error('Error fetching Redis sessions:', error);
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 });
    }
} 