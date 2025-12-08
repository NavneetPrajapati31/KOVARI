const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testAugust2025Scenario() {
    console.log('🔍 Testing August 2025 Scenario (Delhi to Mumbai)\n');
    console.log('================================================\n');

    // Create multiple sessions with overlapping dates in August 2025
    console.log('1. Creating multiple sessions for August 2025...');
    
    const augustSessions = [
        {
            userId: 'user_august_1',
            destinationName: 'Mumbai',
            budget: 12000,
            startDate: '2025-08-07',
            endDate: '2025-08-10'
        },
        {
            userId: 'user_august_2',
            destinationName: 'Mumbai',
            budget: 8000,
            startDate: '2025-08-09',
            endDate: '2025-08-12'
        },
        {
            userId: 'user_august_3',
            destinationName: 'Mumbai',
            budget: 15000,
            startDate: '2025-08-06',
            endDate: '2025-08-11'
        },
        {
            userId: 'user_august_4',
            destinationName: 'Goa',
            budget: 10000,
            startDate: '2025-08-08',
            endDate: '2025-08-11'
        }
    ];

    for (const session of augustSessions) {
        try {
            const response = await fetch(`${BASE_URL}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(session)
            });
            
            if (response.ok) {
                console.log(`✅ Session created for ${session.userId}`);
            } else {
                console.log(`❌ Failed to create session for ${session.userId}`);
            }
        } catch (error) {
            console.log(`❌ Error creating session for ${session.userId}:`, error.message);
        }
    }

    // Test matching for the real user scenario
    console.log('\n2. Testing matching for real user (Delhi to Mumbai, Aug 8-11)...');
    
    const realUserSession = {
        userId: 'user_real_august',
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
            console.log('✅ Real user session created');
            
            // Test matching
            const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_real_august`);
            
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
                    console.log('❌ No matches found - this indicates an issue');
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

    // Test 3: Check what sessions exist now
    console.log('\n3. Checking all sessions in Redis...');
    try {
        const redisResponse = await fetch(`${BASE_URL}/redis/session`);
        if (redisResponse.ok) {
            const sessions = await redisResponse.json();
            console.log(`✅ Found ${sessions.length} total sessions in Redis`);
            
            // Count sessions with Mumbai destination
            let mumbaiSessions = 0;
            let augustSessions = 0;
            
            sessions.forEach((session) => {
                try {
                    const sessionData = JSON.parse(session);
                    if (sessionData.destination?.name === 'Mumbai') {
                        mumbaiSessions++;
                    }
                    if (sessionData.startDate?.includes('2025-08')) {
                        augustSessions++;
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            });
            
            console.log(`📊 Mumbai sessions: ${mumbaiSessions}`);
            console.log(`📊 August 2025 sessions: ${augustSessions}`);
        } else {
            console.log('❌ Failed to get Redis sessions');
        }
    } catch (error) {
        console.log('❌ Error getting Redis sessions:', error.message);
    }
}

testAugust2025Scenario();
