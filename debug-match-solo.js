const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3002/api';

async function debugMatchSolo() {
    console.log('🔍 Debugging Match Solo Endpoint...\n');
    
    // Step 1: Create a test session
    console.log('1. Creating test session...');
    try {
        const sessionResponse = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: 'user_debug',
                destinationName: 'Mumbai',
                budget: 5000,
                startDate: '2024-03-15',
                endDate: '2024-03-20'
            })
        });
        
        console.log(`Session creation status: ${sessionResponse.status}`);
        const sessionResult = await sessionResponse.json();
        console.log('Session result:', sessionResult);
        
    } catch (error) {
        console.error('Session creation failed:', error.message);
        return;
    }
    
    // Step 2: Try to get matches
    console.log('\n2. Getting matches...');
    try {
        const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_debug`);
        console.log(`Match request status: ${matchResponse.status}`);
        
        if (!matchResponse.ok) {
            const errorText = await matchResponse.text();
            console.error('Match request failed:', errorText);
        } else {
            const matches = await matchResponse.json();
            console.log('Matches:', matches);
        }
        
    } catch (error) {
        console.error('Match request failed:', error.message);
    }
}

debugMatchSolo().catch(console.error); 