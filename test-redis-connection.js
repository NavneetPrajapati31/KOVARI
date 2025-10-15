const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3002/api';

async function testRedisConnection() {
    console.log('🔍 Testing Redis Connection...\n');
    
    // Test 1: Create a session (this should work)
    console.log('1. Creating a test session...');
    try {
        const sessionResponse = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_redis_test',
                destinationName: 'Mumbai',
                budget: 5000,
                startDate: '2024-03-15',
                endDate: '2024-03-20'
            })
        });
        
        console.log(`Session creation status: ${sessionResponse.status}`);
        if (sessionResponse.ok) {
            const result = await sessionResponse.json();
            console.log('✅ Session created successfully:', result.message);
        } else {
            const error = await sessionResponse.text();
            console.log('❌ Session creation failed:', error);
        }
    } catch (error) {
        console.error('❌ Session creation error:', error.message);
    }
    
    // Test 2: Try to get the specific session we just created
    console.log('\n2. Testing direct session retrieval...');
    try {
        const sessionResponse = await fetch(`${BASE_URL}/session?userId=user_redis_test`);
        console.log(`Direct session retrieval status: ${sessionResponse.status}`);
        if (sessionResponse.ok) {
            const result = await sessionResponse.json();
            console.log('✅ Session retrieved successfully');
        } else {
            const error = await sessionResponse.text();
            console.log('❌ Session retrieval failed:', error);
        }
    } catch (error) {
        console.error('❌ Session retrieval error:', error.message);
    }
    
    // Test 3: Test geocoding (should work regardless of Redis)
    console.log('\n3. Testing geocoding...');
    try {
        const geoResponse = await fetch(`${BASE_URL}/test-geocoding?location=Mumbai`);
        console.log(`Geocoding status: ${geoResponse.status}`);
        if (geoResponse.ok) {
            const result = await geoResponse.json();
            console.log('✅ Geocoding working:', result.coordinates);
        } else {
            const error = await geoResponse.text();
            console.log('❌ Geocoding failed:', error);
        }
    } catch (error) {
        console.error('❌ Geocoding error:', error.message);
    }
    
    // Test 4: Test matching functionality
    console.log('\n4. Testing matching functionality...');
    try {
        const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_redis_test`);
        console.log(`Match request status: ${matchResponse.status}`);
        if (matchResponse.ok) {
            const matches = await matchResponse.json();
            console.log(`✅ Matching working: Found ${matches.length} matches`);
            if (matches.length > 0) {
                console.log('First match:', matches[0]);
            }
        } else {
            const error = await matchResponse.text();
            console.log('❌ Matching failed:', error);
        }
    } catch (error) {
        console.error('❌ Matching error:', error.message);
    }
}

testRedisConnection().catch(console.error); 