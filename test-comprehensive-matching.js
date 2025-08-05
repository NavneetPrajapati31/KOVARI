const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3002/api';

async function testComprehensiveMatching() {
    console.log('🧪 Comprehensive Matching Test...\n');
    
    // Step 1: Create multiple test users
    const testUsers = [
        {
            userId: 'user_match1',
            destinationName: 'Mumbai',
            budget: 5000,
            startDate: '2024-03-15',
            endDate: '2024-03-20'
        },
        {
            userId: 'user_match2',
            destinationName: 'Mumbai',
            budget: 6000,
            startDate: '2024-03-16',
            endDate: '2024-03-21'
        },
        {
            userId: 'user_match3',
            destinationName: 'Delhi',
            budget: 4000,
            startDate: '2024-03-15',
            endDate: '2024-03-20'
        }
    ];
    
    console.log('1. Creating test users...');
    for (const user of testUsers) {
        try {
            const response = await fetch(`${BASE_URL}/session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });
            
            console.log(`✅ Created session for ${user.userId}: ${response.status}`);
        } catch (error) {
            console.error(`❌ Failed to create session for ${user.userId}:`, error.message);
        }
    }
    
    // Step 2: Test matching for user_match1
    console.log('\n2. Testing matching for user_match1...');
    try {
        const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_match1`);
        console.log(`Match request status: ${matchResponse.status}`);
        
        if (matchResponse.ok) {
            const matches = await matchResponse.json();
            console.log(`✅ Found ${matches.length} matches for user_match1`);
            
            if (matches.length > 0) {
                console.log('\n📊 Match Details:');
                matches.forEach((match, index) => {
                    console.log(`\n${index + 1}. Match with ${match.user.userId}`);
                    console.log(`   Score: ${(match.score * 100).toFixed(1)}%`);
                    console.log(`   Destination: ${match.destination}`);
                    console.log(`   Budget Difference: ${match.breakdown.budgetDifference}`);
                });
            }
        } else {
            const error = await matchResponse.text();
            console.log('❌ Matching failed:', error);
        }
    } catch (error) {
        console.error('❌ Matching error:', error.message);
    }
    
    // Step 3: Test matching for user_match3 (should have fewer matches due to different destination)
    console.log('\n3. Testing matching for user_match3 (Delhi)...');
    try {
        const matchResponse = await fetch(`${BASE_URL}/match-solo?userId=user_match3`);
        console.log(`Match request status: ${matchResponse.status}`);
        
        if (matchResponse.ok) {
            const matches = await matchResponse.json();
            console.log(`✅ Found ${matches.length} matches for user_match3`);
        } else {
            const error = await matchResponse.text();
            console.log('❌ Matching failed:', error);
        }
    } catch (error) {
        console.error('❌ Matching error:', error.message);
    }
}

testComprehensiveMatching().catch(console.error); 