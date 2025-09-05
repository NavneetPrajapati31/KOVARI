// Test script to verify solo matching filters
// Run this in the browser console on the explore page

console.log('🧪 Testing Solo Matching Filters...\n');

// Test 1: Create test sessions with different attributes
const testSessions = [
    {
        userId: 'test_user_1',
        destinationName: 'Mumbai',
        budget: 20000,
        startDate: '2025-08-15',
        endDate: '2025-08-19'
    },
    {
        userId: 'test_user_2', 
        destinationName: 'Mumbai',
        budget: 25000,
        startDate: '2025-08-16',
        endDate: '2025-08-20'
    },
    {
        userId: 'test_user_3',
        destinationName: 'Delhi', // Different destination
        budget: 18000,
        startDate: '2025-08-17',
        endDate: '2025-08-21'
    },
    {
        userId: 'test_user_4',
        destinationName: 'Mumbai',
        budget: 30000,
        startDate: '2025-08-25', // No date overlap
        endDate: '2025-08-30'
    }
];

// Function to create a session
async function createSession(userData) {
    try {
        console.log(`Creating session for ${userData.userId}...`);
        
        const response = await fetch('/api/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Session created for ${userData.userId}: ${result.message}`);
            return true;
        } else {
            const error = await response.json();
            console.log(`❌ Failed to create session for ${userData.userId}: ${error.message}`);
            return false;
        }
    } catch (error) {
        console.log(`❌ Error creating session for ${userData.userId}: ${error.message}`);
        return false;
    }
}

// Function to test matching
async function testMatching(userId) {
    try {
        console.log(`\n🔍 Testing matching for ${userId}...`);
        
        const response = await fetch(`/api/match-solo?userId=${userId}`);
        
        if (response.ok) {
            const matches = await response.json();
            console.log(`✅ Found ${matches.length} matches for ${userId}:`);
            
            if (matches.length > 0) {
                matches.forEach((match, index) => {
                    console.log(`  ${index + 1}. Score: ${Math.round(match.score * 100)}%`);
                    console.log(`     Destination: ${match.destination}, Budget: ₹${match.user.budget}`);
                    console.log(`     Age: ${match.user.age}, Personality: ${match.user.personality}`);
                    console.log(`     Common Interests: ${match.commonInterests?.join(', ') || 'None'}`);
                    console.log(`     Budget Difference: ${match.budgetDifference}`);
                    console.log('     ---');
                });
            } else {
                console.log('  No matches found');
            }
        } else {
            console.log(`❌ Matching failed: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Error testing matching: ${error.message}`);
    }
}

// Function to clear all test sessions
async function clearTestSessions() {
    console.log('\n🧹 Clearing test sessions...');
    const testUserIds = testSessions.map(s => s.userId);
    
    for (const userId of testUserIds) {
        try {
            // Note: In a real app, you'd have a DELETE endpoint
            console.log(`Cleared session for ${userId}`);
        } catch (error) {
            console.log(`Error clearing session for ${userId}: ${error.message}`);
        }
    }
}

// Main test function
async function runFilterTests() {
    console.log('🚀 Starting Solo Matching Filter Tests...\n');
    
    // Step 1: Create test sessions
    console.log('📝 Step 1: Creating test sessions...');
    for (const session of testSessions) {
        await createSession(session);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
    }
    
    // Step 2: Test matching for each user
    console.log('\n🔍 Step 2: Testing matching filters...');
    for (const session of testSessions) {
        await testMatching(session.userId);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
    }
    
    // Step 3: Analyze results
    console.log('\n📊 Step 3: Filter Analysis...');
    console.log('Expected behavior:');
    console.log('- test_user_1 and test_user_2 should match (same destination, overlapping dates)');
    console.log('- test_user_3 should NOT match (different destination)');
    console.log('- test_user_4 should NOT match (no date overlap)');
    
    console.log('\n✅ Filter tests completed!');
}

// Run the tests
runFilterTests();
