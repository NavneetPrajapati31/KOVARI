const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3002/api';

async function testRedisSimple() {
    console.log('🧪 Simple Redis Test...\n');
    
    // Test 1: Create a session
    console.log('1. Creating session...');
    const sessionResponse = await fetch(`${BASE_URL}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user_test1',
            destinationName: 'Mumbai',
            budget: 5000,
            startDate: '2024-03-15',
            endDate: '2024-03-20'
        })
    });
    
    console.log(`Session status: ${sessionResponse.status}`);
    const sessionResult = await sessionResponse.json();
    console.log('Session result:', sessionResult);
    
    // Test 2: Create another session
    console.log('\n2. Creating second session...');
    const session2Response = await fetch(`${BASE_URL}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            userId: 'user_test2',
            destinationName: 'Mumbai',
            budget: 6000,
            startDate: '2024-03-16',
            endDate: '2024-03-21'
        })
    });
    
    console.log(`Session 2 status: ${session2Response.status}`);
    const session2Result = await session2Response.json();
    console.log('Session 2 result:', session2Result);
    
    // Test 3: Check Redis sessions
    console.log('\n3. Checking Redis sessions...');
    try {
        const redisResponse = await fetch(`${BASE_URL}/redis/session`);
        console.log(`Redis status: ${redisResponse.status}`);
        if (redisResponse.ok) {
            const sessions = await redisResponse.json();
            console.log(`Found ${sessions.length} sessions in Redis`);
            sessions.forEach((session, index) => {
                console.log(`  ${index + 1}. ${session.userId} - ${session.destination?.name}`);
            });
        } else {
            const errorText = await redisResponse.text();
            console.error('Redis error:', errorText);
        }
    } catch (error) {
        console.error('Redis test failed:', error.message);
    }
    
    // Test 4: Try matching
    console.log('\n4. Testing matching...');
    try {
        const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_test1`);
        console.log(`Match status: ${matchResponse.status}`);
        
        if (matchResponse.ok) {
            const matches = await matchResponse.json();
            console.log(`Found ${matches.length} matches`);
            if (matches.length > 0) {
                console.log('First match:', matches[0]);
            }
        } else {
            const errorText = await matchResponse.text();
            console.error('Match error:', errorText);
        }
    } catch (error) {
        console.error('Match test failed:', error.message);
    }
}

testRedisSimple().catch(console.error); 