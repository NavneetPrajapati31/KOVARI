const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3002/api';

async function testRedisBasic() {
    console.log('🔍 Basic Redis Test...\n');
    
    // Test 1: Create a session and immediately try to match
    console.log('1. Creating session and testing immediate match...');
    try {
        // Create session
        const sessionResponse = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_basic_test',
                destinationName: 'Mumbai',
                budget: 5000,
                startDate: '2024-03-15',
                endDate: '2024-03-20'
            })
        });
        
        console.log(`Session creation status: ${sessionResponse.status}`);
        
        if (sessionResponse.ok) {
            console.log('✅ Session created successfully');
            
            // Wait a moment for Redis to process
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Try to match immediately
            console.log('\n2. Testing immediate match...');
            const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_basic_test`);
            console.log(`Match status: ${matchResponse.status}`);
            
            if (matchResponse.ok) {
                const matches = await matchResponse.json();
                console.log(`✅ Match successful: Found ${matches.length} matches`);
            } else {
                const error = await matchResponse.text();
                console.log('❌ Match failed:', error);
            }
        } else {
            const error = await sessionResponse.text();
            console.log('❌ Session creation failed:', error);
        }
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testRedisBasic().catch(console.error); 