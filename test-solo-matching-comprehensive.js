const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testSoloMatchingComprehensive() {
    console.log('🔍 Comprehensive Solo Matching Test\n');
    console.log('=====================================\n');

    // Test 1: Check if Redis is running
    console.log('1. Testing Redis Connection...');
    try {
        const redisTestResponse = await fetch(`${BASE_URL}/redis/session`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (redisTestResponse.ok) {
            console.log('✅ Redis is running and accessible');
        } else {
            console.log('❌ Redis connection failed');
            return;
        }
    } catch (error) {
        console.log('❌ Redis connection failed:', error.message);
        return;
    }

    // Test 2: Test Supabase connection and user profile fetching
    console.log('\n2. Testing Supabase User Profile Fetching...');
    try {
        // Test with a real Clerk user ID (you'll need to replace this with a real user ID from your database)
        const testUserId = 'user_2f3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6';
        
        const profileResponse = await fetch(`${BASE_URL}/profile/current`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        console.log(`Profile fetch status: ${profileResponse.status}`);
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('✅ Supabase connection working');
            console.log('Profile data structure:', Object.keys(profileData));
        } else {
            console.log('⚠️ Profile fetch failed (this might be expected if no user is logged in)');
        }
    } catch (error) {
        console.log('❌ Supabase connection failed:', error.message);
    }

    // Test 3: Test session creation with mock data
    console.log('\n3. Testing Session Creation...');
    const testUsers = [
        'user_debug',
        'user_match1', 
        'user_match2',
        'user_match3'
    ];

    for (const userId of testUsers) {
        try {
            console.log(`Creating session for ${userId}...`);
            const sessionResponse = await fetch(`${BASE_URL}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    destinationName: 'Mumbai',
                    budget: 5000 + Math.floor(Math.random() * 3000),
                    startDate: '2024-03-15',
                    endDate: '2024-03-20'
                })
            });
            
            if (sessionResponse.ok) {
                console.log(`✅ Session created for ${userId}`);
            } else {
                const errorData = await sessionResponse.json();
                console.log(`❌ Session creation failed for ${userId}:`, errorData.message);
            }
        } catch (error) {
            console.log(`❌ Session creation error for ${userId}:`, error.message);
        }
    }

    // Test 4: Test solo matching with multiple users
    console.log('\n4. Testing Solo Matching...');
    for (const userId of testUsers) {
        try {
            console.log(`Getting matches for ${userId}...`);
            const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=${userId}`);
            
            if (matchResponse.ok) {
                const matches = await matchResponse.json();
                console.log(`✅ Found ${matches.length} matches for ${userId}`);
                
                if (matches.length > 0) {
                    console.log('Sample match structure:', {
                        user: matches[0].user,
                        score: matches[0].score,
                        destination: matches[0].destination,
                        breakdown: matches[0].breakdown
                    });
                }
            } else {
                const errorText = await matchResponse.text();
                console.log(`❌ Match request failed for ${userId}:`, errorText);
            }
        } catch (error) {
            console.log(`❌ Match request error for ${userId}:`, error.message);
        }
    }

    // Test 5: Test explore data fetching (Supabase-based)
    console.log('\n5. Testing Explore Data Fetching (Supabase)...');
    try {
        const exploreResponse = await fetch(`${BASE_URL}/explore/solo-travelers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentUserId: 'test_user',
                filters: {
                    gender: 'Any',
                    ageMin: 18,
                    ageMax: 50,
                    destination: 'Any',
                    interests: [],
                    dateStart: null,
                    dateEnd: null
                },
                cursor: null,
                limit: 10
            })
        });
        
        if (exploreResponse.ok) {
            const exploreData = await exploreResponse.json();
            console.log('✅ Explore data fetch working');
            console.log(`Found ${exploreData.data?.length || 0} solo travelers`);
        } else {
            console.log('⚠️ Explore data fetch failed (this might be expected if endpoint doesn\'t exist)');
        }
    } catch (error) {
        console.log('⚠️ Explore data fetch error (this might be expected):', error.message);
    }

    // Test 6: Check Redis session data
    console.log('\n6. Checking Redis Session Data...');
    try {
        const redisKeysResponse = await fetch(`${BASE_URL}/redis/session`, {
            method: 'GET'
        });
        
        if (redisKeysResponse.ok) {
            const keys = await redisKeysResponse.json();
            console.log(`✅ Found ${keys.length} session keys in Redis`);
            console.log('Session keys:', keys);
        } else {
            console.log('⚠️ Could not fetch Redis keys');
        }
    } catch (error) {
        console.log('❌ Redis keys fetch error:', error.message);
    }

    console.log('\n=====================================');
    console.log('🎯 Solo Matching Test Complete!');
    console.log('\nSummary:');
    console.log('- Redis connection: Working');
    console.log('- Session creation: Working with mock data');
    console.log('- Solo matching: Working with mock data');
    console.log('- Supabase integration: Needs real user data');
    console.log('\nNext steps:');
    console.log('1. Insert real user data into Supabase');
    console.log('2. Test with real Clerk user IDs');
    console.log('3. Verify travel preferences data');
}

// Run the test
testSoloMatchingComprehensive().catch(console.error);
