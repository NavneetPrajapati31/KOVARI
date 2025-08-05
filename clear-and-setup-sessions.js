const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function clearAndSetupSessions() {
    console.log('🧹 Clearing and setting up fresh sessions...\n');
    
    // Step 1: Create sessions with current dates (August 2025)
    console.log('1. Creating test sessions with current dates...');
    const testSessions = [
        {
            userId: 'user_1',
            destinationName: 'Mumbai',
            budget: 8000,
            startDate: '2025-08-05',
            endDate: '2025-08-10'
        },
        {
            userId: 'user_2',
            destinationName: 'Mumbai',
            budget: 12000,
            startDate: '2025-08-03',
            endDate: '2025-08-12'
        },
        {
            userId: 'user_3',
            destinationName: 'Delhi',
            budget: 9000,
            startDate: '2025-08-06',
            endDate: '2025-08-09'
        },
        {
            userId: 'user_4',
            destinationName: 'Mumbai',
            budget: 15000,
            startDate: '2025-08-04',
            endDate: '2025-08-11'
        },
        {
            userId: 'user_debug',
            destinationName: 'Mumbai',
            budget: 10000,
            startDate: '2025-08-05',
            endDate: '2025-08-10'
        },
        {
            userId: 'user_test1',
            destinationName: 'Mumbai',
            budget: 7000,
            startDate: '2025-08-06',
            endDate: '2025-08-09'
        },
        {
            userId: 'user_test2',
            destinationName: 'Mumbai',
            budget: 11000,
            startDate: '2025-08-04',
            endDate: '2025-08-11'
        },
        {
            userId: 'test_redis_user',
            destinationName: 'Mumbai',
            budget: 9500,
            startDate: '2025-08-05',
            endDate: '2025-08-10'
        },
        {
            userId: 'user_redis_test',
            destinationName: 'Mumbai',
            budget: 8500,
            startDate: '2025-08-06',
            endDate: '2025-08-09'
        },
        {
            userId: 'user_match1',
            destinationName: 'Mumbai',
            budget: 9000,
            startDate: '2025-08-05',
            endDate: '2025-08-10'
        },
        {
            userId: 'user_match2',
            destinationName: 'Mumbai',
            budget: 13000,
            startDate: '2025-08-04',
            endDate: '2025-08-11'
        },
        {
            userId: 'user_match3',
            destinationName: 'Delhi',
            budget: 8000,
            startDate: '2025-08-06',
            endDate: '2025-08-09'
        },
        {
            userId: 'user_basic_test',
            destinationName: 'Mumbai',
            budget: 7500,
            startDate: '2025-08-05',
            endDate: '2025-08-10'
        },
        {
            userId: 'user_status_test',
            destinationName: 'Mumbai',
            budget: 10500,
            startDate: '2025-08-04',
            endDate: '2025-08-11'
        }
    ];
    
    for (const session of testSessions) {
        try {
            const response = await fetch(`${BASE_URL}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(session)
            });
            
            if (response.ok) {
                console.log(`✅ Created session for ${session.userId}: ${session.startDate} to ${session.endDate}`);
            } else {
                console.log(`❌ Failed to create session for ${session.userId}: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ Error creating session for ${session.userId}:`, error.message);
        }
    }
    
    // Step 2: Test matching with the current user
    console.log('\n2. Testing matching with current user...');
    try {
        const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_2yjEnOfpwIeQxWnR9fEvS7sRUrX`);
        console.log(`Match request status: ${matchResponse.status}`);
        
        if (matchResponse.ok) {
            const matches = await matchResponse.json();
            console.log(`✅ Found ${matches.length} matches`);
            
            if (matches.length > 0) {
                console.log('\n📊 Match Details:');
                matches.forEach((match, index) => {
                    console.log(`\n${index + 1}. Match with ${match.user.userId}`);
                    console.log(`   Score: ${(match.score * 100).toFixed(1)}%`);
                    console.log(`   Destination: ${match.destination}`);
                    console.log(`   Budget Difference: ${match.budgetDifference}`);
                    console.log(`   Breakdown:`, {
                        destinationScore: match.breakdown.destinationScore,
                        dateOverlapScore: match.breakdown.dateOverlapScore,
                        budgetScore: match.breakdown.budgetScore
                    });
                });
            } else {
                console.log('❌ Still no matches found - there might be another issue');
            }
        } else {
            const error = await matchResponse.text();
            console.log('❌ Matching failed:', error);
        }
    } catch (error) {
        console.error('❌ Matching error:', error.message);
    }
}

clearAndSetupSessions().catch(console.error); 