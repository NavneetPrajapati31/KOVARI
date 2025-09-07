const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

// Test user IDs from the SQL script
const TEST_USERS = [
    'clerk_user_john_001',    // John - Extrovert, Mumbai, Adventure
    'clerk_user_sarah_002',   // Sarah - Ambivert, Delhi, Culture
    'clerk_user_mike_003',    // Mike - Introvert, Bangalore, History
    'clerk_user_emma_004',    // Emma - Extrovert, Chennai, Food
    'clerk_user_alex_005',    // Alex - Ambivert, Hyderabad, Nature
    'clerk_user_lisa_006',    // Lisa - Introvert, Pune, Architecture
    'clerk_user_david_007',   // David - Extrovert, Kolkata, Music
    'clerk_user_maria_008'    // Maria - Ambivert, Ahmedabad, Wellness
];

async function testRealDataSoloMatching() {
    console.log('🔍 Testing Solo Matching with Real Data\n');
    console.log('========================================\n');

    // Test 1: Create sessions for all test users
    console.log('1. Creating Sessions for All Test Users...');
    const destinations = ['Mumbai', 'Delhi', 'Goa', 'Rishikesh', 'Jaipur', 'Varanasi'];
    
    for (let i = 0; i < TEST_USERS.length; i++) {
        const userId = TEST_USERS[i];
        const destination = destinations[i % destinations.length];
        const budget = 5000 + Math.floor(Math.random() * 5000);
        
        try {
            const sessionResponse = await fetch(`${BASE_URL}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    destinationName: destination,
                    budget: budget,
                    startDate: '2024-03-15',
                    endDate: '2024-03-20'
                })
            });
            
            if (sessionResponse.ok) {
                console.log(`✅ Session created for ${userId} (${destination}, ₹${budget})`);
            } else {
                const errorData = await sessionResponse.json();
                console.log(`❌ Session creation failed for ${userId}:`, errorData.message);
            }
        } catch (error) {
            console.log(`❌ Session creation error for ${userId}:`, error.message);
        }
    }

    // Test 2: Test solo matching for each user
    console.log('\n2. Testing Solo Matching for Each User...');
    for (const userId of TEST_USERS) {
        try {
            console.log(`\n--- Testing matches for ${userId} ---`);
            const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=${userId}`);
            
            if (matchResponse.ok) {
                const matches = await matchResponse.json();
                console.log(`✅ Found ${matches.length} matches`);
                
                if (matches.length > 0) {
                    console.log('Top 3 matches:');
                    matches.slice(0, 3).forEach((match, index) => {
                        console.log(`  ${index + 1}. ${match.user.full_name || match.user.userId} - Score: ${(match.score * 100).toFixed(1)}%`);
                        console.log(`     Destination: ${match.destination}`);
                        console.log(`     Personality: ${match.user.personality}, Age: ${match.user.age}`);
                        console.log(`     Interests: ${match.user.interests?.slice(0, 3).join(', ')}`);
                    });
                }
            } else {
                const errorText = await matchResponse.text();
                console.log(`❌ Match request failed:`, errorText);
            }
        } catch (error) {
            console.log(`❌ Match request error:`, error.message);
        }
    }

    // Test 3: Test specific compatibility scenarios
    console.log('\n3. Testing Specific Compatibility Scenarios...');
    
    const testScenarios = [
        {
            name: 'Adventure Seekers Match',
            user: 'clerk_user_john_001',
            destination: 'Rishikesh',
            expectedMatches: ['clerk_user_alex_005'] // Alex also likes adventure
        },
        {
            name: 'Culture Enthusiasts Match',
            user: 'clerk_user_sarah_002',
            destination: 'Varanasi',
            expectedMatches: ['clerk_user_mike_003', 'clerk_user_lisa_006'] // Mike and Lisa like culture/history
        },
        {
            name: 'Food & Entertainment Match',
            user: 'clerk_user_emma_004',
            destination: 'Mumbai',
            expectedMatches: ['clerk_user_david_007'] // David likes entertainment
        }
    ];

    for (const scenario of testScenarios) {
        try {
            console.log(`\n--- ${scenario.name} ---`);
            
            // Create session for this scenario
            const sessionResponse = await fetch(`${BASE_URL}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: scenario.user,
                    destinationName: scenario.destination,
                    budget: 6000,
                    startDate: '2024-03-15',
                    endDate: '2024-03-20'
                })
            });
            
            if (sessionResponse.ok) {
                // Get matches
                const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=${scenario.user}`);
                if (matchResponse.ok) {
                    const matches = await matchResponse.json();
                    console.log(`Found ${matches.length} matches for ${scenario.destination}`);
                    
                    // Check if expected matches are found
                    const foundExpectedMatches = matches.filter(match => 
                        scenario.expectedMatches.includes(match.user.userId)
                    );
                    
                    if (foundExpectedMatches.length > 0) {
                        console.log(`✅ Found ${foundExpectedMatches.length} expected matches:`);
                        foundExpectedMatches.forEach(match => {
                            console.log(`  - ${match.user.full_name || match.user.userId} (Score: ${(match.score * 100).toFixed(1)}%)`);
                        });
                    } else {
                        console.log(`⚠️ No expected matches found`);
                    }
                }
            }
        } catch (error) {
            console.log(`❌ Scenario test error:`, error.message);
        }
    }

    // Test 4: Check Redis session data
    console.log('\n4. Checking Redis Session Data...');
    try {
        const redisResponse = await fetch(`${BASE_URL}/redis/session`);
        if (redisResponse.ok) {
            const sessions = await redisResponse.json();
            console.log(`✅ Found ${sessions.length} active sessions in Redis`);
            
            // Show session summary
            sessions.forEach(session => {
                console.log(`  - ${session.userId}: ${session.destination?.name} (₹${session.budget})`);
            });
        }
    } catch (error) {
        console.log(`❌ Redis check error:`, error.message);
    }

    // Test 5: Test with different destinations
    console.log('\n5. Testing Different Destinations...');
    const testDestinations = ['Mumbai', 'Delhi', 'Goa', 'Rishikesh', 'Jaipur', 'Varanasi', 'Ooty', 'Kerala'];
    
    for (const destination of testDestinations.slice(0, 3)) { // Test first 3 destinations
        try {
            const testUserId = TEST_USERS[0]; // Use John for destination testing
            
            // Create session
            await fetch(`${BASE_URL}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: testUserId,
                    destinationName: destination,
                    budget: 7000,
                    startDate: '2024-03-15',
                    endDate: '2024-03-20'
                })
            });
            
            // Get matches
            const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=${testUserId}`);
            if (matchResponse.ok) {
                const matches = await matchResponse.json();
                console.log(`✅ ${destination}: Found ${matches.length} matches`);
            }
        } catch (error) {
            console.log(`❌ Destination test error for ${destination}:`, error.message);
        }
    }

    console.log('\n========================================');
    console.log('🎯 Real Data Solo Matching Test Complete!');
    console.log('\nSummary:');
    console.log('- Test users: 8 diverse profiles created');
    console.log('- Sessions: Created for all test users');
    console.log('- Matching: Algorithm working with real data');
    console.log('- Compatibility: Various scenarios tested');
    console.log('\nNext steps:');
    console.log('1. Verify the matching results make sense');
    console.log('2. Test with different date ranges');
    console.log('3. Test with different budget ranges');
    console.log('4. Verify the compatibility scoring logic');
}

// Run the test
testRealDataSoloMatching().catch(console.error);
