// Script to insert test data for solo matching with overlapping dates
// This script creates multiple user sessions with overlapping travel dates to test matching

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000/api'; // Adjust port if needed

// Test data with overlapping dates for August 2025
const testUsers = [
    // User 1: Mumbai trip Aug 15-19 (5 days)
    {
        userId: 'user_mumbai_1',
        destinationName: 'Mumbai',
        budget: 20000,
        startDate: '2025-08-15',
        endDate: '2025-08-19',
        static_attributes: {
            age: 25,
            gender: 'female',
            personality: 'extrovert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'no',
            drinking: 'socially',
            religion: 'hindu',
            interests: ['travel', 'photography', 'food', 'nightlife'],
            language: 'english',
            nationality: 'indian',
            profession: 'software_engineer'
        }
    },
    
    // User 2: Mumbai trip Aug 16-20 (5 days) - overlaps with User 1
    {
        userId: 'user_mumbai_2',
        destinationName: 'Mumbai',
        budget: 25000,
        startDate: '2025-08-16',
        endDate: '2025-08-20',
        static_attributes: {
            age: 28,
            gender: 'male',
            personality: 'ambivert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'no',
            drinking: 'socially',
            religion: 'agnostic',
            interests: ['travel', 'photography', 'adventure', 'culture'],
            language: 'english',
            nationality: 'indian',
            profession: 'designer'
        }
    },
    
    // User 3: Mumbai trip Aug 17-21 (5 days) - overlaps with both User 1 and 2
    {
        userId: 'user_mumbai_3',
        destinationName: 'Mumbai',
        budget: 18000,
        startDate: '2025-08-17',
        endDate: '2025-08-21',
        static_attributes: {
            age: 24,
            gender: 'female',
            personality: 'introvert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'no',
            drinking: 'no',
            religion: 'christian',
            interests: ['travel', 'culture', 'history', 'museums'],
            language: 'english',
            nationality: 'indian',
            profession: 'teacher'
        }
    },
    
    // User 4: Mumbai trip Aug 18-22 (5 days) - overlaps with User 2 and 3
    {
        userId: 'user_mumbai_4',
        destinationName: 'Mumbai',
        budget: 30000,
        startDate: '2025-08-18',
        endDate: '2025-08-22',
        static_attributes: {
            age: 30,
            gender: 'male',
            personality: 'extrovert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'no',
            drinking: 'socially',
            religion: 'hindu',
            interests: ['travel', 'adventure', 'sports', 'nightlife'],
            language: 'english',
            nationality: 'indian',
            profession: 'marketing'
        }
    },
    
    // User 5: Mumbai trip Aug 19-23 (5 days) - overlaps with User 3 and 4
    {
        userId: 'user_mumbai_5',
        destinationName: 'Mumbai',
        budget: 22000,
        startDate: '2025-08-19',
        endDate: '2025-08-23',
        static_attributes: {
            age: 26,
            gender: 'female',
            personality: 'ambivert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'no',
            drinking: 'socially',
            religion: 'hindu',
            interests: ['travel', 'shopping', 'food', 'photography'],
            language: 'english',
            nationality: 'indian',
            profession: 'architect'
        }
    },
    
    // User 6: Mumbai trip Aug 20-24 (5 days) - overlaps with User 4 and 5
    {
        userId: 'user_mumbai_6',
        destinationName: 'Mumbai',
        budget: 28000,
        startDate: '2025-08-20',
        endDate: '2025-08-24',
        static_attributes: {
            age: 29,
            gender: 'male',
            personality: 'extrovert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'no',
            drinking: 'socially',
            religion: 'muslim',
            interests: ['travel', 'adventure', 'culture', 'food'],
            language: 'english',
            nationality: 'indian',
            profession: 'doctor'
        }
    },
    
    // User 7: Mumbai trip Aug 21-25 (5 days) - overlaps with User 5 and 6
    {
        userId: 'user_mumbai_7',
        destinationName: 'Mumbai',
        budget: 24000,
        startDate: '2025-08-21',
        endDate: '2025-08-25',
        static_attributes: {
            age: 27,
            gender: 'female',
            personality: 'introvert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'no',
            drinking: 'no',
            religion: 'hindu',
            interests: ['travel', 'yoga', 'wellness', 'nature'],
            language: 'english',
            nationality: 'indian',
            profession: 'yoga_instructor'
        }
    },
    
    // User 8: Mumbai trip Aug 22-26 (5 days) - overlaps with User 6 and 7
    {
        userId: 'user_mumbai_8',
        destinationName: 'Mumbai',
        budget: 26000,
        startDate: '2025-08-22',
        endDate: '2025-08-26',
        static_attributes: {
            age: 31,
            gender: 'male',
            personality: 'ambivert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'no',
            drinking: 'socially',
            religion: 'hindu',
            interests: ['travel', 'technology', 'startups', 'networking'],
            language: 'english',
            nationality: 'indian',
            profession: 'entrepreneur'
        }
    },
    
    // User 9: Mumbai trip Aug 23-27 (5 days) - overlaps with User 7 and 8
    {
        userId: 'user_mumbai_9',
        destinationName: 'Mumbai',
        budget: 20000,
        startDate: '2025-08-23',
        endDate: '2025-08-27',
        static_attributes: {
            age: 25,
            gender: 'female',
            personality: 'extrovert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'no',
            drinking: 'socially',
            religion: 'christian',
            interests: ['travel', 'dancing', 'music', 'socializing'],
            language: 'english',
            nationality: 'indian',
            profession: 'dance_instructor'
        }
    },
    
    // User 10: Mumbai trip Aug 24-28 (5 days) - overlaps with User 8 and 9
    {
        userId: 'user_mumbai_10',
        destinationName: 'Mumbai',
        budget: 32000,
        startDate: '2025-08-24',
        endDate: '2025-08-28',
        static_attributes: {
            age: 33,
            gender: 'male',
            personality: 'extrovert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'no',
            drinking: 'socially',
            religion: 'hindu',
            interests: ['travel', 'business', 'luxury', 'fine_dining'],
            language: 'english',
            nationality: 'indian',
            profession: 'business_executive'
        }
    }
];

// Function to create a session for a user
async function createSession(userData) {
    try {
        console.log(`Creating session for ${userData.userId}...`);
        
        const response = await fetch(`${BASE_URL}/session`, {
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
        
        const response = await fetch(`${BASE_URL}/match-solo?userId=${userId}`);
        
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

// Main function to run the script
async function main() {
    console.log('🚀 Starting solo matching test data insertion...\n');
    
    // Create sessions for all test users
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
    
    if (successful > 0) {
        console.log('\n🧪 Testing matching functionality...');
        
        // Test matching for the first few users
        const testUsers = results.filter(r => r.success).slice(0, 3);
        for (const user of testUsers) {
            await testMatching(user.userId);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    console.log('\n✨ Test data insertion completed!');
    console.log('\n📝 Date Overlap Summary:');
    console.log('User 1: Aug 15-19 (overlaps with User 2, 3)');
    console.log('User 2: Aug 16-20 (overlaps with User 1, 3, 4)');
    console.log('User 3: Aug 17-21 (overlaps with User 1, 2, 4, 5)');
    console.log('User 4: Aug 18-22 (overlaps with User 2, 3, 5, 6)');
    console.log('User 5: Aug 19-23 (overlaps with User 3, 4, 6, 7)');
    console.log('User 6: Aug 20-24 (overlaps with User 4, 5, 7, 8)');
    console.log('User 7: Aug 21-25 (overlaps with User 5, 6, 8, 9)');
    console.log('User 8: Aug 22-26 (overlaps with User 6, 7, 9, 10)');
    console.log('User 9: Aug 23-27 (overlaps with User 7, 8, 10)');
    console.log('User 10: Aug 24-28 (overlaps with User 8, 9)');
}

// Run the script
if (require.main === module) {
    main().catch(console.error);
}

module.exports = { testUsers, createSession, testMatching };
