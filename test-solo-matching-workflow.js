// Test script for solo matching workflow
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3001/api';

// Dummy user data for testing
const dummyUsers = [
    {
        userId: 'user_1',
        destinationName: 'Mumbai',
        budget: 5000,
        startDate: '2024-03-15',
        endDate: '2024-03-20',
        static_attributes: {
            age: 25,
            gender: 'female',
            personality: 'extrovert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'no',
            drinking: 'socially',
            religion: 'hindu',
            interests: ['travel', 'photography', 'food'],
            language: 'english',
            nationality: 'indian',
            profession: 'software_engineer'
        }
    },
    {
        userId: 'user_2',
        destinationName: 'Mumbai',
        budget: 6000,
        startDate: '2024-03-16',
        endDate: '2024-03-21',
        static_attributes: {
            age: 28,
            gender: 'male',
            personality: 'ambivert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'no',
            drinking: 'socially',
            religion: 'agnostic',
            interests: ['travel', 'photography', 'adventure'],
            language: 'english',
            nationality: 'indian',
            profession: 'designer'
        }
    },
    {
        userId: 'user_3',
        destinationName: 'Delhi',
        budget: 4000,
        startDate: '2024-03-15',
        endDate: '2024-03-20',
        static_attributes: {
            age: 30,
            gender: 'female',
            personality: 'introvert',
            location: { lat: 28.7041, lon: 77.1025 }, // Delhi
            smoking: 'no',
            drinking: 'no',
            religion: 'hindu',
            interests: ['travel', 'culture', 'history'],
            language: 'english',
            nationality: 'indian',
            profession: 'teacher'
        }
    },
    {
        userId: 'user_4',
        destinationName: 'Mumbai',
        budget: 7000,
        startDate: '2024-03-14',
        endDate: '2024-03-22',
        static_attributes: {
            age: 26,
            gender: 'male',
            personality: 'extrovert',
            location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
            smoking: 'yes',
            drinking: 'yes',
            religion: 'christian',
            interests: ['travel', 'music', 'nightlife'],
            language: 'english',
            nationality: 'indian',
            profession: 'marketing'
        }
    }
];

async function testSessionCreation() {
    console.log('🧪 Testing Session Creation...');
    
    for (const user of dummyUsers) {
        try {
            const response = await fetch(`${BASE_URL}/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.userId,
                    destinationName: user.destinationName,
                    budget: user.budget,
                    startDate: user.startDate,
                    endDate: user.endDate
                })
            });
            
            const result = await response.json();
            console.log(`✅ Session created for ${user.userId}: ${result.message}`);
            
        } catch (error) {
            console.error(`❌ Failed to create session for ${user.userId}:`, error.message);
        }
    }
}

async function testMatchingWorkflow() {
    console.log('\n🧪 Testing Matching Workflow...');
    
    // Test matching for user_1
    try {
        const response = await fetch(`${BASE_URL}/match-solo?userId=user_1`);
        console.log(`Response status: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Match request failed: ${response.status} - ${errorText}`);
            return;
        }
        
        const matches = await response.json();
        console.log(`✅ Found ${Array.isArray(matches) ? matches.length : 'undefined'} matches for user_1`);
        
        if (Array.isArray(matches) && matches.length > 0) {
            console.log('\n📊 Match Details:');
            matches.forEach((match, index) => {
                console.log(`\n${index + 1}. Match with ${match.user.userId}`);
                console.log(`   Score: ${(match.score * 100).toFixed(1)}%`);
                console.log(`   Destination: ${match.destination}`);
                console.log(`   Budget Difference: ${match.breakdown.budgetDifference}`);
                console.log(`   Breakdown:`);
                console.log(`     - Destination: ${(match.breakdown.destinationScore * 100).toFixed(1)}%`);
                console.log(`     - Date Overlap: ${(match.breakdown.dateOverlapScore * 100).toFixed(1)}%`);
                console.log(`     - Budget: ${(match.breakdown.budgetScore * 100).toFixed(1)}%`);
                console.log(`     - Interests: ${(match.breakdown.interestScore * 100).toFixed(1)}%`);
                console.log(`     - Age: ${(match.breakdown.ageScore * 100).toFixed(1)}%`);
                console.log(`     - Personality: ${(match.breakdown.personalityScore * 100).toFixed(1)}%`);
            });
        } else {
            console.log('ℹ️ No matches found (this might be expected if no compatible users)');
        }
        
    } catch (error) {
        console.error('❌ Failed to get matches:', error.message);
    }
}

async function testGeocoding() {
    console.log('\n🧪 Testing Geocoding...');
    
    const testLocations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai'];
    
    for (const location of testLocations) {
        try {
            const response = await fetch(`${BASE_URL}/test-geocoding?location=${encodeURIComponent(location)}`);
            const result = await response.json();
            
            if (result.coordinates) {
                console.log(`✅ ${location}: ${result.coordinates.lat}, ${result.coordinates.lon}`);
            } else {
                console.log(`❌ ${location}: Not found`);
            }
            
        } catch (error) {
            console.error(`❌ Failed to geocode ${location}:`, error.message);
        }
    }
}

async function testRedisConnection() {
    console.log('\n🧪 Testing Redis Connection...');
    
    try {
        const response = await fetch(`${BASE_URL}/session`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: 'test_user',
                destinationName: 'Mumbai',
                budget: 5000,
                startDate: '2024-03-15',
                endDate: '2024-03-20'
            })
        });
        
        if (response.ok) {
            console.log('✅ Redis connection working');
        } else {
            console.log('❌ Redis connection failed');
        }
        
    } catch (error) {
        console.error('❌ Redis test failed:', error.message);
    }
}

async function checkRedisSessions() {
    console.log('\n🧪 Checking Redis Sessions...');
    
    try {
        const response = await fetch(`${BASE_URL}/redis/session`);
        if (response.ok) {
            const sessions = await response.json();
            console.log(`✅ Found ${sessions.length} sessions in Redis`);
            sessions.forEach((session, index) => {
                console.log(`  ${index + 1}. ${session.userId || 'Unknown'}`);
            });
        } else {
            console.log('❌ Could not fetch Redis sessions');
        }
    } catch (error) {
        console.error('❌ Failed to check Redis sessions:', error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting Solo Matching Workflow Tests...\n');
    
    await testRedisConnection();
    await testGeocoding();
    await testSessionCreation();
    await checkRedisSessions();
    await testMatchingWorkflow();
    
    console.log('\n✅ All tests completed!');
}

// Run the tests
runAllTests().catch(console.error); 