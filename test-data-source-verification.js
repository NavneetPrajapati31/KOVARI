const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testDataSourceVerification() {
    console.log('🔍 Testing Data Source Verification\n');
    console.log('====================================\n');

    // Test 1: Check if real user (from image) uses Supabase data
    console.log('1. Testing real user (user_2yjEnOfpwIeQxWnR9fEvS7sRUrX)...');
    
    const realUserSession = {
        userId: 'user_2yjEnOfpwIeQxWnR9fEvS7sRUrX', // Real user from image
        destinationName: 'Mumbai',
        budget: 10000,
        startDate: '2025-08-08',
        endDate: '2025-08-11'
    };

    try {
        const response = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(realUserSession)
        });
        
        if (response.ok) {
            console.log('✅ Session created for real user');
            
            // Test matching to see what data is used
            const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_2yjEnOfpwIeQxWnR9fEvS7sRUrX`);
            
            if (matchResponse.ok) {
                const matches = await matchResponse.json();
                console.log(`✅ Found ${matches.length} matches for real user`);
                
                if (matches.length > 0) {
                    console.log('\n📊 Real User Match Details:');
                    matches.forEach((match, index) => {
                        console.log(`\n${index + 1}. Match with ${match.user.userId}`);
                        console.log(`   Score: ${(match.score * 100).toFixed(1)}%`);
                        console.log(`   Destination: ${match.destination}`);
                        console.log(`   User Details:`);
                        console.log(`     - Age: ${match.user.age}`);
                        console.log(`     - Gender: ${match.user.gender}`);
                        console.log(`     - Personality: ${match.user.personality}`);
                        console.log(`     - Interests: ${match.user.interests?.join(', ')}`);
                        console.log(`     - Location: ${match.user.location?.lat}, ${match.user.location?.lon}`);
                    });
                }
            } else {
                const errorText = await matchResponse.text();
                console.log('❌ Match request failed:', errorText);
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Session creation failed:', errorText);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 2: Check if mock user uses mock data
    console.log('\n2. Testing mock user (user_real_august)...');
    
    const mockUserSession = {
        userId: 'user_real_august', // Mock user I added
        destinationName: 'Mumbai',
        budget: 10000,
        startDate: '2025-08-08',
        endDate: '2025-08-11'
    };

    try {
        const response = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockUserSession)
        });
        
        if (response.ok) {
            console.log('✅ Session created for mock user');
            
            // Test matching to see what data is used
            const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_real_august`);
            
            if (matchResponse.ok) {
                const matches = await matchResponse.json();
                console.log(`✅ Found ${matches.length} matches for mock user`);
                
                if (matches.length > 0) {
                    console.log('\n📊 Mock User Match Details:');
                    matches.forEach((match, index) => {
                        console.log(`\n${index + 1}. Match with ${match.user.userId}`);
                        console.log(`   Score: ${(match.score * 100).toFixed(1)}%`);
                        console.log(`   Destination: ${match.destination}`);
                        console.log(`   User Details:`);
                        console.log(`     - Age: ${match.user.age}`);
                        console.log(`     - Gender: ${match.user.gender}`);
                        console.log(`     - Personality: ${match.user.personality}`);
                        console.log(`     - Interests: ${match.user.interests?.join(', ')}`);
                        console.log(`     - Location: ${match.user.location?.lat}, ${match.user.location?.lon}`);
                    });
                }
            } else {
                const errorText = await matchResponse.text();
                console.log('❌ Match request failed:', errorText);
            }
        } else {
            const errorText = await response.text();
            console.log('❌ Session creation failed:', errorText);
        }
    } catch (error) {
        console.log('❌ Error:', error.message);
    }

    // Test 3: Check current user profile API
    console.log('\n3. Testing current user profile API...');
    try {
        const profileResponse = await fetch(`${BASE_URL}/profile/current`);
        console.log(`Profile API status: ${profileResponse.status}`);
        
        if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('✅ Profile API working');
            console.log('Profile data keys:', Object.keys(profileData));
            console.log('Profile data:', JSON.stringify(profileData, null, 2));
        } else {
            const errorText = await profileResponse.text();
            console.log('❌ Profile API failed:', errorText);
        }
    } catch (error) {
        console.log('❌ Profile API error:', error.message);
    }

    console.log('\n====================================');
    console.log('🎯 Data Source Verification Complete!');
    console.log('\nExpected Results:');
    console.log('- Real user should use Supabase data (if profile exists)');
    console.log('- Mock user should use mock data');
    console.log('- Profile API should return user data from Supabase');
}

testDataSourceVerification();
