const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3002/api';

async function testRedisStatus() {
    console.log('🔍 Testing Redis Status...\n');
    
    // Test 1: Check if the server is responding
    console.log('1. Testing server response...');
    try {
        const response = await fetch(`${BASE_URL}/test-geocoding?location=Test`);
        console.log(`Server status: ${response.status}`);
        console.log('✅ Server is responding');
    } catch (error) {
        console.error('❌ Server not responding:', error.message);
        return;
    }
    
    // Test 2: Create a session (this should work if Redis is working)
    console.log('\n2. Testing session creation...');
    try {
        const sessionResponse = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_status_test',
                destinationName: 'Mumbai',
                budget: 5000,
                startDate: '2024-03-15',
                endDate: '2024-03-20'
            })
        });
        
        console.log(`Session creation status: ${sessionResponse.status}`);
        if (sessionResponse.ok) {
            console.log('✅ Session creation working (Redis is accessible)');
        } else {
            const error = await sessionResponse.text();
            console.log('❌ Session creation failed:', error);
        }
    } catch (error) {
        console.error('❌ Session creation error:', error.message);
    }
    
    // Test 3: Try to access Redis sessions endpoint
    console.log('\n3. Testing Redis sessions endpoint...');
    try {
        const redisResponse = await fetch(`${BASE_URL}/redis/session`);
        console.log(`Redis sessions status: ${redisResponse.status}`);
        if (redisResponse.ok) {
            const sessions = await redisResponse.json();
            console.log(`✅ Redis sessions working: Found ${sessions.length} sessions`);
        } else {
            const error = await redisResponse.text();
            console.log('❌ Redis sessions failed:', error);
        }
    } catch (error) {
        console.error('❌ Redis sessions error:', error.message);
    }
}

testRedisStatus().catch(console.error); 