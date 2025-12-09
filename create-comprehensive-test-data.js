#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const redis = require('redis');

console.log('🚀 Creating Comprehensive Test Data for KOVARI Algorithm Testing...\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
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

function logTest(message) {
  log(`🧪 ${message}`, 'magenta');
}

// Helper function to get future dates relative to today
function getFutureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Generate comprehensive test users with various profiles
function generateComprehensiveTestUsers() {
  const testUsers = [
    // ===== MUMBAI TRAVELERS (Multiple overlapping dates) =====
    {
      userId: 'user_mumbai_1',
      destinationName: 'Mumbai',
      budget: 25000,
      startDate: getFutureDate(30),
      endDate: getFutureDate(35),
      profile: {
        age: 28,
        gender: 'female',
        personality: 'ambivert',
        location: { lat: 28.7041, lon: 77.1025 }, // Delhi
        smoking: 'no',
        drinking: 'socially',
        religion: 'christian',
        interests: ['culture', 'photography', 'art'],
        language: 'english',
        languages: ['english', 'hindi'],
        nationality: 'indian',
        profession: 'ui_ux_designer'
      }
    },
    {
      userId: 'user_mumbai_2',
      destinationName: 'Mumbai',
      budget: 18000,
      startDate: getFutureDate(33),
      endDate: getFutureDate(40),
      profile: {
        age: 30,
        gender: 'male',
        personality: 'introvert',
        location: { lat: 12.9716, lon: 77.5946 }, // Bangalore
        smoking: 'no',
        drinking: 'no',
        religion: 'hindu',
        interests: ['history', 'culture', 'architecture'],
        language: 'english',
        languages: ['english', 'hindi', 'kannada'],
        nationality: 'indian',
        profession: 'history_teacher'
      }
    },
    {
      userId: 'user_mumbai_3',
      destinationName: 'Mumbai',
      budget: 30000,
      startDate: getFutureDate(35),
      endDate: getFutureDate(43),
      profile: {
        age: 26,
        gender: 'female',
        personality: 'extrovert',
        location: { lat: 13.0827, lon: 80.2707 }, // Chennai
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['food', 'nightlife', 'shopping'],
        language: 'english',
        languages: ['english', 'hindi', 'tamil'],
        nationality: 'indian',
        profession: 'marketing_manager'
      }
    },
    {
      userId: 'user_mumbai_4',
      destinationName: 'Mumbai',
      budget: 22000,
      startDate: getFutureDate(37),
      endDate: getFutureDate(45),
      profile: {
        age: 27,
        gender: 'male',
        personality: 'ambivert',
        location: { lat: 17.3850, lon: 78.4867 }, // Hyderabad
        smoking: 'no',
        drinking: 'socially',
        religion: 'agnostic',
        interests: ['nature', 'photography', 'hiking'],
        language: 'english',
        languages: ['english', 'hindi', 'telugu'],
        nationality: 'indian',
        profession: 'full_stack_developer'
      }
    },
    {
      userId: 'user_mumbai_5',
      destinationName: 'Mumbai',
      budget: 28000,
      startDate: getFutureDate(40),
      endDate: getFutureDate(46),
      profile: {
        age: 29,
        gender: 'female',
        personality: 'introvert',
        location: { lat: 15.2993, lon: 74.1240 }, // Goa
        smoking: 'no',
        drinking: 'no',
        religion: 'christian',
        interests: ['architecture', 'art', 'design'],
        language: 'english',
        languages: ['english', 'hindi', 'konkani'],
        nationality: 'indian',
        profession: 'architect'
      }
    },

    // ===== GOA TRAVELERS (Different dates) =====
    {
      userId: 'user_goa_1',
      destinationName: 'Goa',
      budget: 35000,
      startDate: getFutureDate(45),
      endDate: getFutureDate(50),
      profile: {
        age: 25,
        gender: 'male',
        personality: 'extrovert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['beach', 'nightlife', 'adventure'],
        language: 'english',
        languages: ['english', 'hindi'],
        nationality: 'indian',
        profession: 'software_engineer'
      }
    },
    {
      userId: 'user_goa_2',
      destinationName: 'Goa',
      budget: 28000,
      startDate: getFutureDate(48),
      endDate: getFutureDate(53),
      profile: {
        age: 31,
        gender: 'female',
        personality: 'ambivert',
        location: { lat: 28.7041, lon: 77.1025 }, // Delhi
        smoking: 'no',
        drinking: 'socially',
        religion: 'sikh',
        interests: ['beach', 'yoga', 'wellness'],
        language: 'english',
        languages: ['english', 'hindi', 'punjabi'],
        nationality: 'indian',
        profession: 'yoga_instructor'
      }
    },

    // ===== DELHI TRAVELERS =====
    {
      userId: 'user_delhi_1',
      destinationName: 'Delhi',
      budget: 20000,
      startDate: getFutureDate(50),
      endDate: getFutureDate(57),
      profile: {
        age: 24,
        gender: 'male',
        personality: 'extrovert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'no',
        religion: 'muslim',
        interests: ['history', 'culture', 'food'],
        language: 'english',
        languages: ['english', 'hindi', 'urdu'],
        nationality: 'indian',
        profession: 'student'
      }
    },
    {
      userId: 'user_delhi_2',
      destinationName: 'Delhi',
      budget: 32000,
      startDate: getFutureDate(52),
      endDate: getFutureDate(59),
      profile: {
        age: 33,
        gender: 'female',
        personality: 'introvert',
        location: { lat: 12.9716, lon: 77.5946 }, // Bangalore
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['museums', 'art', 'shopping'],
        language: 'english',
        languages: ['english', 'hindi', 'kannada'],
        nationality: 'indian',
        profession: 'art_curator'
      }
    },

    // ===== BANGALORE TRAVELERS =====
    {
      userId: 'user_bangalore_1',
      destinationName: 'Bangalore',
      budget: 15000,
      startDate: getFutureDate(55),
      endDate: getFutureDate(62),
      profile: {
        age: 22,
        gender: 'female',
        personality: 'extrovert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'no',
        religion: 'hindu',
        interests: ['tech', 'startups', 'food'],
        language: 'english',
        languages: ['english', 'hindi'],
        nationality: 'indian',
        profession: 'student'
      }
    },
    {
      userId: 'user_bangalore_2',
      destinationName: 'Bangalore',
      budget: 45000,
      startDate: getFutureDate(58),
      endDate: getFutureDate(65),
      profile: {
        age: 35,
        gender: 'male',
        personality: 'ambivert',
        location: { lat: 28.7041, lon: 77.1025 }, // Delhi
        smoking: 'no',
        drinking: 'socially',
        religion: 'none',
        interests: ['tech', 'business', 'networking'],
        language: 'english',
        languages: ['english', 'hindi'],
        nationality: 'indian',
        profession: 'entrepreneur'
      }
    },

    // ===== CHENNAI TRAVELERS =====
    {
      userId: 'user_chennai_1',
      destinationName: 'Chennai',
      budget: 18000,
      startDate: getFutureDate(60),
      endDate: getFutureDate(67),
      profile: {
        age: 26,
        gender: 'male',
        personality: 'introvert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'no',
        religion: 'hindu',
        interests: ['music', 'culture', 'temples'],
        language: 'english',
        languages: ['english', 'hindi', 'tamil'],
        nationality: 'indian',
        profession: 'musician'
      }
    },

    // ===== HYDERABAD TRAVELERS =====
    {
      userId: 'user_hyderabad_1',
      destinationName: 'Hyderabad',
      budget: 25000,
      startDate: getFutureDate(65),
      endDate: getFutureDate(72),
      profile: {
        age: 29,
        gender: 'female',
        personality: 'extrovert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'muslim',
        interests: ['food', 'history', 'shopping'],
        language: 'english',
        languages: ['english', 'hindi', 'urdu'],
        nationality: 'indian',
        profession: 'food_blogger'
      }
    },

    // ===== KOLKATA TRAVELERS =====
    {
      userId: 'user_kolkata_1',
      destinationName: 'Kolkata',
      budget: 22000,
      startDate: getFutureDate(70),
      endDate: getFutureDate(77),
      profile: {
        age: 27,
        gender: 'male',
        personality: 'ambivert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['literature', 'culture', 'food'],
        language: 'english',
        languages: ['english', 'hindi', 'bengali'],
        nationality: 'indian',
        profession: 'writer'
      }
    },

    // ===== PUNE TRAVELERS =====
    {
      userId: 'user_pune_1',
      destinationName: 'Pune',
      budget: 19000,
      startDate: getFutureDate(75),
      endDate: getFutureDate(82),
      profile: {
        age: 25,
        gender: 'female',
        personality: 'extrovert',
        location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
        smoking: 'no',
        drinking: 'socially',
        religion: 'hindu',
        interests: ['education', 'culture', 'nature'],
        language: 'english',
        languages: ['english', 'hindi', 'marathi'],
        nationality: 'indian',
        profession: 'teacher'
      }
    }
  ];
  
  return testUsers;
}

// Create comprehensive test data directly in Redis
async function createComprehensiveTestData() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6380'
  });
  
  try {
    await client.connect();
    logInfo('Connected to Redis successfully!');
    
    const testUsers = generateComprehensiveTestUsers();
    
    // Display the generated test data
    console.log('\n📅 Comprehensive Test Data Generated:');
    console.log('=====================================');
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.userId}: ${user.destinationName}`);
      console.log(`   📍 Destination: ${user.destinationName}`);
      console.log(`   💰 Budget: ₹${user.budget.toLocaleString()}`);
      console.log(`   📅 Dates: ${user.startDate} to ${user.endDate}`);
      console.log(`   👤 Profile: ${user.profile.age}yo ${user.profile.gender}, ${user.profile.personality}`);
      console.log(`   🏠 From: ${getCityName(user.profile.location)}`);
      console.log(`   🎯 Interests: ${user.profile.interests.join(', ')}`);
      console.log('');
    });
    
    // Store test data in Redis
    logInfo('Storing comprehensive test data in Redis...');
    
    for (const user of testUsers) {
      const key = `session:${user.userId}`;
      
      const userData = {
        userId: user.userId,
        destination: {
          name: user.destinationName,
          lat: getDestinationCoords(user.destinationName).lat,
          lon: getDestinationCoords(user.destinationName).lon
        },
        budget: user.budget,
        startDate: user.startDate,
        endDate: user.endDate,
        createdAt: new Date().toISOString(),
        isSoloMatch: true,
        static_attributes: {
          location: user.profile.location,
          interests: user.profile.interests,
          personality: user.profile.personality,
          profession: user.profile.profession,
          nationality: user.profile.nationality,
          languages: user.profile.languages,
          smoking: user.profile.smoking,
          drinking: user.profile.drinking,
          age: user.profile.age,
          gender: user.profile.gender,
          religion: user.profile.religion
        }
      };
      
      await client.set(key, JSON.stringify(userData));
      logSuccess(`Stored data for ${user.userId}`);
    }
    
    // Create indexes for easy querying
    logInfo('Creating Redis indexes...');
    
    // Sessions index
    const sessionsKey = 'sessions:index';
    const sessionIds = testUsers.map(user => user.userId);
    await client.set(sessionsKey, JSON.stringify(sessionIds));
    
    // Destination-based indexes
    const destinations = [...new Set(testUsers.map(user => user.destinationName))];
    for (const destination of destinations) {
      const destKey = `destination:${destination}`;
      const destUsers = testUsers.filter(user => user.destinationName === destination);
      await client.set(destKey, JSON.stringify(destUsers.map(user => user.userId)));
    }
    
    // Personality-based indexes
    const personalities = [...new Set(testUsers.map(user => user.profile.personality))];
    for (const personality of personalities) {
      const personalityKey = `personality:${personality}`;
      const personalityUsers = testUsers.filter(user => user.profile.personality === personality);
      await client.set(personalityKey, JSON.stringify(personalityUsers.map(user => user.userId)));
    }
    
    // Age group indexes
    const ageGroups = {
      '18-25': testUsers.filter(user => user.profile.age >= 18 && user.profile.age <= 25),
      '26-35': testUsers.filter(user => user.profile.age >= 26 && user.profile.age <= 35),
      '36+': testUsers.filter(user => user.profile.age >= 36)
    };
    
    for (const [ageGroup, users] of Object.entries(ageGroups)) {
      const ageKey = `age:${ageGroup}`;
      await client.set(ageKey, JSON.stringify(users.map(user => user.userId)));
    }
    
    logSuccess(`\n🎉 Successfully created comprehensive test data for ${testUsers.length} users!`);
    
    // Show testing scenarios
    console.log('\n🧪 Testing Scenarios Available:');
    console.log('===============================');
    console.log('📍 **Mumbai Matching (5 users, overlapping dates):**');
    console.log('   • Test date overlap filtering');
    console.log('   • Test multiple compatible matches');
    console.log('   • Test personality compatibility');
    console.log('');
    console.log('🏖️ **Goa Matching (2 users, different dates):**');
    console.log('   • Test date range filtering');
    console.log('   • Test budget compatibility');
    console.log('');
    console.log('🏛️ **Delhi Matching (2 users, different profiles):**');
    console.log('   • Test religion compatibility');
    console.log('   • Test interest matching');
    console.log('');
    console.log('💻 **Bangalore Matching (2 users, tech focus):**');
    console.log('   • Test profession compatibility');
    console.log('   • Test interest-based matching');
    console.log('');
    console.log('🎭 **Other Cities (Chennai, Hyderabad, Kolkata, Pune):**');
    console.log('   • Test various personality types');
    console.log('   • Test different age groups');
    console.log('   • Test diverse interests');
    
    // Show search suggestions
    console.log('\n🎯 **Search Testing Suggestions:**');
    console.log('================================');
    console.log('• **Mumbai Search:** Dates around', getFutureDate(33), 'to', getFutureDate(40));
    console.log('  - Should find 3-4 compatible matches');
    console.log('  - Test overlapping date filtering');
    console.log('');
    console.log('• **Goa Search:** Dates around', getFutureDate(45), 'to', getFutureDate(53));
    console.log('  - Should find 1-2 compatible matches');
    console.log('  - Test date range compatibility');
    console.log('');
    console.log('• **Delhi Search:** Dates around', getFutureDate(50), 'to', getFutureDate(59));
    console.log('  - Should find 1-2 compatible matches');
    console.log('  - Test profile compatibility');
    
    console.log('\n💡 **Ready for end-to-end algorithm testing!**');
    
  } catch (error) {
    logError('Failed to create comprehensive test data:');
    logError(error.message);
    logError('Full error:');
    logError(JSON.stringify(error, null, 2));
  } finally {
    await client.disconnect();
  }
}

// Helper function to get destination coordinates
function getDestinationCoords(destName) {
  const coords = {
    'mumbai': { lat: 19.0760, lon: 72.8777 },
    'goa': { lat: 15.2993, lon: 74.1240 },
    'delhi': { lat: 28.7041, lon: 77.1025 },
    'bangalore': { lat: 12.9716, lon: 77.5946 },
    'chennai': { lat: 13.0827, lon: 80.2707 },
    'hyderabad': { lat: 17.3850, lon: 78.4867 },
    'kolkata': { lat: 22.5726, lon: 88.3639 },
    'pune': { lat: 18.5204, lon: 73.8567 }
  };
  
  return coords[destName.toLowerCase()] || coords['mumbai'];
}

// Helper function to get city name from coordinates
function getCityName(coords) {
  const cities = {
    '19.0760,72.8777': 'Mumbai',
    '15.2993,74.1240': 'Goa',
    '28.7041,77.1025': 'Delhi',
    '12.9716,77.5946': 'Bangalore',
    '13.0827,80.2707': 'Chennai',
    '17.3850,78.4867': 'Hyderabad',
    '22.5726,88.3639': 'Kolkata',
    '18.5204,73.8567': 'Pune'
  };
  
  const key = `${coords.lat},${coords.lon}`;
  return cities[key] || 'Unknown City';
}

// Run the script
if (require.main === module) {
  createComprehensiveTestData().catch(error => {
    logError('Unexpected error:');
    logError(error.message);
    process.exit(1);
  });
}

module.exports = { generateComprehensiveTestUsers, createComprehensiveTestData };
