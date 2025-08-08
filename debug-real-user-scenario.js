const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function debugRealUserScenario() {
    console.log('🔍 Debugging Real User Scenario (Delhi to Mumbai)\n');
    console.log('================================================\n');

    // Test the exact scenario from the image
    console.log('1. Creating session for real user (Delhi to Mumbai)...');
    
    const realUserSession = {
        userId: 'user_real_test',
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
            
            // Test matching
            console.log('\n2. Testing solo matching for real user...');
            const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_real_test`);
            
            if (matchResponse.ok) {
                const matches = await matchResponse.json();
                console.log(`✅ Found ${matches.length} matches for real user`);
                
                if (matches.length > 0) {
                    console.log('\n📊 Match Details:');
                    matches.forEach((match, index) => {
                        console.log(`\n${index + 1}. Match with ${match.user.userId}`);
                        console.log(`   Score: ${(match.score * 100).toFixed(1)}%`);
                        console.log(`   Destination: ${match.destination}`);
                        console.log(`   Budget Difference: ${match.budgetDifference}`);
                        console.log(`   Breakdown:`);
                        console.log(`     - Destination: ${(match.breakdown.destinationScore * 100).toFixed(1)}%`);
                        console.log(`     - Date Overlap: ${(match.breakdown.dateOverlapScore * 100).toFixed(1)}%`);
                        console.log(`     - Budget: ${(match.breakdown.budgetScore * 100).toFixed(1)}%`);
                    });
                } else {
                    console.log('❌ No matches found - this is the problem!');
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

    // Test 2: Check what sessions exist in Redis
    console.log('\n3. Checking existing sessions...');
    try {
        const redisResponse = await fetch(`${BASE_URL}/redis/session`);
        if (redisResponse.ok) {
            const sessions = await redisResponse.json();
            console.log(`✅ Found ${sessions.length} total sessions in Redis`);
            
            if (sessions.length > 0) {
                console.log('\n📋 Session Summary:');
                sessions.forEach((session, index) => {
                    const sessionData = JSON.parse(session);
                    console.log(`${index + 1}. ${sessionData.userId}: ${sessionData.destination.name} (${sessionData.startDate} - ${sessionData.endDate})`);
                });
            }
        } else {
            console.log('❌ Failed to get Redis sessions');
        }
    } catch (error) {
        console.log('❌ Error getting Redis sessions:', error.message);
    }

    // Test 3: Create a test session with overlapping dates to see if it matches
    console.log('\n4. Creating test session with overlapping dates...');
    
    const testOverlapSession = {
        userId: 'user_test_overlap',
        destinationName: 'Mumbai',
        budget: 8000,
        startDate: '2025-08-09', // Overlaps with Aug 8-11
        endDate: '2025-08-12'
    };

    try {
        const response = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testOverlapSession)
        });
        
        if (response.ok) {
            console.log('✅ Test overlap session created');
            
            // Test matching again
            const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_real_test`);
            if (matchResponse.ok) {
                const matches = await matchResponse.json();
                console.log(`✅ Real user now has ${matches.length} matches`);
                
                if (matches.length > 0) {
                    console.log('🎉 SUCCESS: Found matches after creating overlap session!');
                } else {
                    console.log('❌ Still no matches - deeper issue exists');
                }
            }
        } else {
            console.log('❌ Failed to create test overlap session');
        }
    } catch (error) {
        console.log('❌ Error creating test session:', error.message);
    }
}

debugRealUserScenario();
