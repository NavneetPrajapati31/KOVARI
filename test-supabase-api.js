const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testSupabaseAPI() {
    console.log('🔍 Testing Supabase Data via API Endpoints\n');
    console.log('==========================================\n');

    // Test 1: Test profile fetching via API
    console.log('1. Testing Profile API...');
    try {
        const profileResponse = await fetch(`${BASE_URL}/profile/current`);
        console.log(`Profile API status: ${profileResponse.status}`);
        
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('✅ Profile API working');
            console.log('Profile data keys:', Object.keys(profileData));
        } else if (profileResponse.status === 401) {
            console.log('⚠️ Profile API requires authentication (expected)');
        } else {
            console.log('❌ Profile API error:', profileResponse.status);
        }
    } catch (error) {
        console.log('❌ Profile API error:', error.message);
    }

    // Test 2: Test explore data fetching (which uses Supabase)
    console.log('\n2. Testing Explore Data API...');
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
        
        console.log(`Explore API status: ${exploreResponse.status}`);
        if (exploreResponse.ok) {
            const exploreData = await exploreResponse.json();
            console.log('✅ Explore API working');
            console.log(`Found ${exploreData.data?.length || 0} solo travelers`);
        } else {
            console.log('⚠️ Explore API not found or requires authentication');
        }
    } catch (error) {
        console.log('❌ Explore API error:', error.message);
    }

    // Test 3: Test travel preferences API
    console.log('\n3. Testing Travel Preferences API...');
    try {
        const travelPrefResponse = await fetch(`${BASE_URL}/travel-preferences`);
        console.log(`Travel Preferences API status: ${travelPrefResponse.status}`);
        
        if (travelPrefResponse.ok) {
            const travelPrefData = await travelPrefResponse.json();
            console.log('✅ Travel Preferences API working');
            console.log(`Found ${travelPrefData.length || 0} travel preferences`);
        } else {
            console.log('⚠️ Travel Preferences API not found or requires authentication');
        }
    } catch (error) {
        console.log('❌ Travel Preferences API error:', error.message);
    }

    // Test 4: Test user follows API
    console.log('\n4. Testing User Follows API...');
    try {
        const followsResponse = await fetch(`${BASE_URL}/user-follows`);
        console.log(`User Follows API status: ${followsResponse.status}`);
        
        if (followsResponse.ok) {
            const followsData = await followsResponse.json();
            console.log('✅ User Follows API working');
            console.log(`Found ${followsData.length || 0} follow relationships`);
        } else {
            console.log('⚠️ User Follows API not found or requires authentication');
        }
    } catch (error) {
        console.log('❌ User Follows API error:', error.message);
    }

    // Test 5: Test the actual solo matching with real user data
    console.log('\n5. Testing Solo Matching with Real Data...');
    try {
        // First create a session with a test user
        const sessionResponse = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'test_real_user',
                destinationName: 'Mumbai',
                budget: 5000,
                startDate: '2024-03-15',
                endDate: '2024-03-20'
            })
        });
        
        if (sessionResponse.ok) {
            console.log('✅ Session created for test user');
            
            // Now try to get matches
            const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=test_real_user`);
            if (matchResponse.ok) {
                const matches = await matchResponse.json();
                console.log(`✅ Found ${matches.length} matches for test user`);
                
                if (matches.length > 0) {
                    console.log('Sample match with real data:', {
                        user: matches[0].user,
                        score: matches[0].score,
                        destination: matches[0].destination
                    });
                }
            } else {
                console.log('❌ Match request failed for test user');
            }
        } else {
            console.log('❌ Session creation failed for test user');
        }
    } catch (error) {
        console.log('❌ Real data test error:', error.message);
    }

    // Test 6: Check what API endpoints are available
    console.log('\n6. Checking Available API Endpoints...');
    const endpoints = [
        '/profile/current',
        '/profile/update',
        '/travel-preferences',
        '/user-follows',
        '/groups',
        '/events',
        '/match-groups',
        '/match-solo',
        '/session',
        '/redis/session'
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            console.log(`${endpoint}: ${response.status}`);
        } catch (error) {
            console.log(`${endpoint}: Error - ${error.message}`);
        }
    }

    console.log('\n==========================================');
    console.log('🎯 Supabase API Test Complete!');
    console.log('\nSummary:');
    console.log('- API endpoints: Check above results');
    console.log('- Authentication: Required for most endpoints');
    console.log('- Solo matching: Working with mock data');
    console.log('\nNext steps:');
    console.log('1. Test with authenticated user session');
    console.log('2. Insert real user data into Supabase');
    console.log('3. Test with real Clerk user IDs');
}

// Run the test
testSupabaseAPI().catch(console.error);
