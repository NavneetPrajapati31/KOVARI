#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const redis = require('redis');

console.log('🚀 Creating Simple Test Data for KOVARI...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Helper function to get future dates relative to today
function getFutureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Generate test users with overlapping trips in the future
function generateTestUsers() {
  const testUsers = [
    // Mumbai trips with overlapping dates
    {
      userId: 'user_mumbai_1',
      destinationName: 'Mumbai',
      budget: 25000,
      startDate: getFutureDate(30),
      endDate: getFutureDate(35)
    },
    {
      userId: 'user_mumbai_2',
      destinationName: 'Mumbai',
      budget: 18000,
      startDate: getFutureDate(33),
      endDate: getFutureDate(40)
    },
    {
      userId: 'user_mumbai_3',
      destinationName: 'Mumbai',
      budget: 30000,
      startDate: getFutureDate(35),
      endDate: getFutureDate(43)
    },
    {
      userId: 'user_mumbai_4',
      destinationName: 'Mumbai',
      budget: 22000,
      startDate: getFutureDate(37),
      endDate: getFutureDate(45)
    },
    {
      userId: 'user_mumbai_5',
      destinationName: 'Mumbai',
      budget: 28000,
      startDate: getFutureDate(40),
      endDate: getFutureDate(46)
    },
    
    // Different destinations for variety
    {
      userId: 'user_goa_1',
      destinationName: 'Goa',
      budget: 35000,
      startDate: getFutureDate(45),
      endDate: getFutureDate(50)
    },
    {
      userId: 'user_delhi_1',
      destinationName: 'Delhi',
      budget: 20000,
      startDate: getFutureDate(50),
      endDate: getFutureDate(57)
    },
    {
      userId: 'user_bangalore_1',
      destinationName: 'Bangalore',
      budget: 15000,
      startDate: getFutureDate(55),
      endDate: getFutureDate(62)
    }
  ];
  
  return testUsers;
}

// Create test data directly in Redis
async function createTestData() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6380'
  });
  
  try {
    await client.connect();
    logInfo('Connected to Redis successfully!');
    
    const testUsers = generateTestUsers();
    
    // Display the generated test data
    console.log('\n📅 Generated Test Data:');
    console.log('========================');
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.userId}: ${user.destinationName}`);
      console.log(`   📍 Destination: ${user.destinationName}`);
      console.log(`   💰 Budget: ₹${user.budget.toLocaleString()}`);
      console.log(`   📅 Dates: ${user.startDate} to ${user.endDate}`);
      console.log(`   🕐 Trip Length: ${Math.ceil((new Date(user.endDate) - new Date(user.startDate)) / (1000 * 60 * 60 * 24))} days`);
      console.log('');
    });
    
    // Store test data in Redis
    logInfo('Storing test data in Redis...');
    
    for (const user of testUsers) {
      const key = `session:${user.userId}`;
      
      // Get coordinates based on destination
      const getDestinationCoords = (destName) => {
        switch (destName.toLowerCase()) {
          case 'mumbai': return { lat: 19.0760, lon: 72.8777 };
          case 'goa': return { lat: 15.2993, lon: 74.1240 };
          case 'delhi': return { lat: 28.7041, lon: 77.1025 };
          case 'bangalore': return { lat: 12.9716, lon: 77.5946 };
          case 'chennai': return { lat: 13.0827, lon: 80.2707 };
          case 'hyderabad': return { lat: 17.3850, lon: 78.4867 };
          default: return { lat: 19.0760, lon: 72.8777 }; // Default to Mumbai
        }
      };
      
      const coords = getDestinationCoords(user.destinationName);
      
      const userData = {
        userId: user.userId,
        destination: {
          name: user.destinationName,
          lat: coords.lat,
          lon: coords.lon
        },
        budget: user.budget,
        startDate: user.startDate,
        endDate: user.endDate,
        createdAt: new Date().toISOString(),
        isSoloMatch: true,
        static_attributes: {
          location: {
            lat: coords.lat,
            lon: coords.lon
          },
          interests: ['travel', 'culture', 'food'],
          personality: Math.random() > 0.5 ? 'extrovert' : 'introvert',
          profession: ['Software Engineer', 'Designer', 'Manager', 'Student', 'Entrepreneur'][Math.floor(Math.random() * 5)],
          nationality: 'Indian',
          languages: ['English', 'Hindi'],
          smoking: Math.random() > 0.7 ? 'yes' : 'no',
          drinking: ['yes', 'no', 'socially'][Math.floor(Math.random() * 3)],
          age: 22 + Math.floor(Math.random() * 15), // Random age between 22-37
          gender: Math.random() > 0.5 ? 'male' : 'female',
          religion: ['none', 'hindu', 'muslim', 'christian', 'sikh'][Math.floor(Math.random() * 5)]
        }
      };
      
      await client.set(key, JSON.stringify(userData));
      logSuccess(`Stored data for ${user.userId}`);
    }
    
    // Create a sessions index
    const sessionsKey = 'sessions:index';
    const sessionIds = testUsers.map(user => user.userId);
    await client.set(sessionsKey, JSON.stringify(sessionIds));
    
    // Create destination-based indexes
    const destinations = [...new Set(testUsers.map(user => user.destinationName))];
    for (const destination of destinations) {
      const destKey = `destination:${destination}`;
      const destUsers = testUsers.filter(user => user.destinationName === destination);
      await client.set(destKey, JSON.stringify(destUsers.map(user => user.userId)));
    }
    
    logSuccess(`\n🎉 Successfully created test data for ${testUsers.length} users!`);
    
    // Show search suggestions
    console.log('\n🎯 Search Suggestions:');
    console.log('=====================');
    console.log('• Search for "Mumbai" with dates around:', getFutureDate(33), 'to', getFutureDate(40));
    console.log('• Search for "Goa" with dates around:', getFutureDate(45), 'to', getFutureDate(50));
    console.log('• Search for "Delhi" with dates around:', getFutureDate(50), 'to', getFutureDate(57));
    console.log('');
    console.log('💡 You can now test your matching functionality!');
    
  } catch (error) {
    logError('Failed to create test data:');
    logError(error.message);
    logError('Full error:');
    logError(JSON.stringify(error, null, 2));
  } finally {
    await client.disconnect();
  }
}

// Run the script
if (require.main === module) {
  createTestData().catch(error => {
    logError('Unexpected error:');
    logError(error.message);
    process.exit(1);
  });
}

module.exports = { generateTestUsers, createTestData };
