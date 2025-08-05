const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function debugMatchingIssue() {
    console.log('🔍 Debugging Matching Issue...\n');
    
    // Step 1: Create a test session with current user
    console.log('1. Creating test session for current user...');
    try {
        const sessionResponse = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_2yjEnOfpwIeQxWnR9fEvS7sRUrX',
                destinationName: 'Mumbai',
                budget: 10000,
                startDate: '2025-08-04',
                endDate: '2025-08-11'
            })
        });
        
        console.log(`Session creation status: ${sessionResponse.status}`);
        const sessionResult = await sessionResponse.json();
        console.log('Session result:', sessionResult);
        
    } catch (error) {
        console.error('Session creation failed:', error.message);
        return;
    }
    
    // Step 2: Create a few test sessions with overlapping dates
    console.log('\n2. Creating test sessions with overlapping dates...');
    const testSessions = [
        {
            userId: 'user_test1',
            destinationName: 'Mumbai',
            budget: 8000,
            startDate: '2025-08-05',
            endDate: '2025-08-10'
        },
        {
            userId: 'user_test2',
            destinationName: 'Mumbai',
            budget: 12000,
            startDate: '2025-08-03',
            endDate: '2025-08-12'
        },
        {
            userId: 'user_test3',
            destinationName: 'Mumbai',
            budget: 9000,
            startDate: '2025-08-06',
            endDate: '2025-08-09'
        }
    ];
    
    for (const session of testSessions) {
        try {
            const response = await fetch(`${BASE_URL}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(session)
            });
            
            console.log(`✅ Created session for ${session.userId}: ${response.status}`);
        } catch (error) {
            console.error(`❌ Failed to create session for ${session.userId}:`, error.message);
        }
    }
    
    // Step 3: Test matching
    console.log('\n3. Testing matching...');
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
                    console.log(`   Breakdown:`, match.breakdown);
                });
            } else {
                console.log('❌ No matches found - this indicates a filtering issue');
            }
        } else {
            const error = await matchResponse.text();
            console.log('❌ Matching failed:', error);
        }
    } catch (error) {
        console.error('❌ Matching error:', error.message);
    }
}

debugMatchingIssue().catch(console.error); 