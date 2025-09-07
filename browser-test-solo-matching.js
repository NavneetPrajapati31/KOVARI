// Browser-friendly script to test solo matching
// Copy and paste this into your browser console on the explore page

// Test data with overlapping dates for August 2025
const testUsers = [
    // User 1: Mumbai trip Aug 15-19 (5 days)
    {
        userId: 'user_mumbai_1',
        destinationName: 'Mumbai',
        budget: 20000,
        startDate: '2025-08-15',
        endDate: '2025-08-19'
    },
    
    // User 2: Mumbai trip Aug 16-20 (5 days) - overlaps with User 1
    {
        userId: 'user_mumbai_2',
        destinationName: 'Mumbai',
        budget: 25000,
        startDate: '2025-08-16',
        endDate: '2025-08-20'
    },
    
    // User 3: Mumbai trip Aug 17-21 (5 days) - overlaps with both User 1 and 2
    {
        userId: 'user_mumbai_3',
        destinationName: 'Mumbai',
        budget: 18000,
        startDate: '2025-08-17',
        endDate: '2025-08-21'
    },
    
    // User 4: Mumbai trip Aug 18-22 (5 days) - overlaps with User 2 and 3
    {
        userId: 'user_mumbai_4',
        destinationName: 'Mumbai',
        budget: 30000,
        startDate: '2025-08-18',
        endDate: '2025-08-22'
    },
    
    // User 5: Mumbai trip Aug 19-23 (5 days) - overlaps with User 3 and 4
    {
        userId: 'user_mumbai_5',
        destinationName: 'Mumbai',
        budget: 22000,
        startDate: '2025-08-19',
        endDate: '2025-08-23'
    }
];

// Function to create a session for a user
async function createSession(userData) {
    try {
        console.log(`Creating session for ${userData.userId}...`);
        
        const response = await fetch('/api/session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userData.userId,
                destinationName: userData.destinationName,
                budget: userData.budget,
                startDate: userData.startDate,
                endDate: userData.endDate
            }),
        });

        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Session created for ${userData.userId}:`, result.message);
            return true;
        } else {
            const error = await response.json();
            console.error(`❌ Failed to create session for ${userData.userId}:`, error.message);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error creating session for ${userData.userId}:`, error.message);
        return false;
    }
}

// Function to test matching for a specific user
async function testMatching(userId) {
    try {
        console.log(`\n🔍 Testing matching for ${userId}...`);
        
        const response = await fetch(`/api/match-solo?userId=${userId}`);
        
        if (response.ok) {
            const matches = await response.json();
            console.log(`✅ Found ${matches.length} matches for ${userId}:`);
            
            matches.forEach((match, index) => {
                console.log(`  ${index + 1}. ${match.user.full_name || match.user.userId} - Score: ${Math.round(match.score * 100)}%`);
                console.log(`     Destination: ${match.destination}, Budget: ₹${match.user.budget}`);
            });
        } else {
            const error = await response.json();
            console.error(`❌ Failed to get matches for ${userId}:`, error.message);
        }
    } catch (error) {
        console.error(`❌ Error testing matching for ${userId}:`, error.message);
    }
}

// Function to create all test sessions
async function createAllTestSessions() {
    console.log('🚀 Creating all test sessions...\n');
    
    const results = [];
    for (const user of testUsers) {
        const success = await createSession(user);
        results.push({ userId: user.userId, success });
        
        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary of results
    console.log('\n📊 Session Creation Summary:');
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log(`✅ Successful: ${successful}`);
    console.log(`❌ Failed: ${failed}`);
    
    return results;
}

// Function to test all users
async function testAllUsers() {
    console.log('🧪 Testing matching for all users...\n');
    
    for (const user of testUsers) {
        await testMatching(user.userId);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// Main function to run everything
async function runFullTest() {
    console.log('🎯 Running full solo matching test...\n');
    
    // Step 1: Create all test sessions
    const results = await createAllTestSessions();
    
    if (results.filter(r => r.success).length > 0) {
        // Step 2: Wait a bit for sessions to be processed
        console.log('\n⏳ Waiting for sessions to be processed...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Step 3: Test matching for all users
        await testAllUsers();
    }
    
    console.log('\n✨ Full test completed!');
    console.log('\n📝 Date Overlap Summary:');
    console.log('User 1: Aug 15-19 (overlaps with User 2, 3)');
    console.log('User 2: Aug 16-20 (overlaps with User 1, 3, 4)');
    console.log('User 3: Aug 17-21 (overlaps with User 1, 2, 4, 5)');
    console.log('User 4: Aug 18-22 (overlaps with User 2, 3, 5)');
    console.log('User 5: Aug 19-23 (overlaps with User 3, 4)');
}

// Make functions available globally
window.testSoloMatching = {
    createSession,
    testMatching,
    createAllTestSessions,
    testAllUsers,
    runFullTest,
    testUsers
};

console.log('🚀 Solo matching test functions loaded!');
console.log('Available functions:');
console.log('- window.testSoloMatching.createSession(userData)');
console.log('- window.testSoloMatching.testMatching(userId)');
console.log('- window.testSoloMatching.createAllTestSessions()');
console.log('- window.testSoloMatching.testAllUsers()');
console.log('- window.testSoloMatching.runFullTest()');
console.log('\nTo run the full test, use: window.testSoloMatching.runFullTest()');
