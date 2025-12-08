#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api';

async function testSearchFlow() {
  console.log('🔍 Testing Search Flow...\n');
  
  try {
    // Step 1: Create a session (simulate what happens when user searches)
    console.log('1. Creating session for test user...');
    const sessionResponse = await fetch(`${BASE_URL}/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test_searcher_123',
        destinationName: 'Goa',
        budget: 35000,
        startDate: '2025-10-12',
        endDate: '2025-10-17',
        travelMode: 'solo'
      })
    });
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('✅ Session created:', sessionData);
    } else {
      console.log('❌ Failed to create session:', sessionResponse.status);
      const errorText = await sessionResponse.text();
      console.log('Error details:', errorText);
      return;
    }
    
    // Step 2: Check what's in Redis now
    console.log('\n2. Checking Redis sessions...');
    const redisResponse = await fetch(`${BASE_URL}/redis/session`);
    if (redisResponse.ok) {
      const redisData = await redisResponse.json();
      console.log('✅ Redis sessions:', redisData);
    } else {
      console.log('❌ Failed to check Redis:', redisResponse.status);
    }
    
    // Step 3: Try to find matches
    console.log('\n3. Searching for matches...');
    const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=test_searcher_123`);
    if (matchResponse.ok) {
      const matches = await matchResponse.json();
      console.log('✅ Found matches:', matches);
      console.log(`Total matches: ${matches.length}`);
    } else {
      console.log('❌ Failed to find matches:', matchResponse.status);
      const errorText = await matchResponse.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run the test
testSearchFlow();
