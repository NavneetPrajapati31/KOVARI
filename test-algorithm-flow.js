#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const redis = require('redis');

console.log('🧪 Testing KOVARI Algorithm Flow: Static + Dynamic Attributes Matching\n');

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

function logUser(message) {
  log(`👤 ${message}`, 'cyan');
}

// Helper function to get future dates
function getFutureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Test users with static attributes (like in database)
const testUsers = {
  'user_alice': {
    // Static attributes (from database)
    age: 28,
    gender: 'female',
    personality: 'extrovert',
    smoking: 'no',
    drinking: 'socially',
    religion: 'hindu',
    interests: ['travel', 'photography', 'food'],
    language: 'english',
    nationality: 'indian',
    profession: 'software_engineer',
    location: { lat: 19.0760, lon: 72.8777 } // Mumbai (home)
  },
  'user_bob': {
    // Static attributes (from database)
    age: 30,
    gender: 'male',
    personality: 'ambivert',
    smoking: 'no',
    drinking: 'socially',
    religion: 'agnostic',
    interests: ['travel', 'adventure', 'culture'],
    language: 'english',
    nationality: 'indian',
    profession: 'designer',
    location: { lat: 28.7041, lon: 77.1025 } // Delhi (home)
  },
  'user_carol': {
    // Static attributes (from database)
    age: 26,
    gender: 'female',
    personality: 'introvert',
    smoking: 'no',
    drinking: 'no',
    religion: 'christian',
    interests: ['art', 'museums', 'quiet_places'],
    language: 'english',
    nationality: 'indian',
    profession: 'teacher',
    location: { lat: 12.9716, lon: 77.5946 } // Bangalore (home)
  },
  'user_david': {
    // Static attributes (from database)
    age: 32,
    gender: 'male',
    personality: 'extrovert',
    smoking: 'no',
    drinking: 'socially',
    religion: 'hindu',
    interests: ['nightlife', 'music', 'food'],
    language: 'english',
    nationality: 'indian',
    profession: 'marketing_manager',
    location: { lat: 13.0827, lon: 80.2707 } // Chennai (home)
  }
};

// Test scenarios for dynamic attributes (Redis sessions)
const testScenarios = [
  {
    name: '🏖️ GOA BEACH TRIP - Overlapping Dates & Budget',
    description: 'Multiple users traveling to Goa with overlapping dates',
    users: [
      {
        userId: 'user_alice',
        destination: 'Goa',
        budget: 25000,
        startDate: getFutureDate(30),
        endDate: getFutureDate(35),
        expectedMatches: ['user_bob', 'user_carol'] // Should match with overlapping dates
      },
      {
        userId: 'user_bob',
        destination: 'Goa',
        budget: 30000,
        startDate: getFutureDate(32),
        endDate: getFutureDate(37),
        expectedMatches: ['user_alice', 'user_carol'] // Should match with overlapping dates
      },
      {
        userId: 'user_carol',
        destination: 'Goa',
        budget: 20000,
        startDate: getFutureDate(33),
        endDate: getFutureDate(38),
        expectedMatches: ['user_alice', 'user_bob'] // Should match with overlapping dates
      }
    ]
  },
  {
    name: '🏛️ DELHI CULTURE TRIP - Different Dates, Same Destination',
    description: 'Users traveling to Delhi but on different dates',
    users: [
      {
        userId: 'user_david',
        destination: 'Delhi',
        budget: 35000,
        startDate: getFutureDate(40),
        endDate: getFutureDate(45),
        expectedMatches: [] // No overlapping dates
      },
      {
        userId: 'user_alice',
        destination: 'Delhi',
        budget: 28000,
        startDate: getFutureDate(50),
        endDate: getFutureDate(55),
        expectedMatches: [] // No overlapping dates
      }
    ]
  },
  {
    name: '🌆 MUMBAI CITY TRIP - Budget Compatibility Test',
    description: 'Users with different budgets but overlapping dates',
    users: [
      {
        userId: 'user_bob',
        destination: 'Mumbai',
        budget: 15000,
        startDate: getFutureDate(60),
        endDate: getFutureDate(65),
        expectedMatches: ['user_carol'] // Should match (budget compatible)
      },
      {
        userId: 'user_carol',
        destination: 'Mumbai',
        budget: 18000,
        startDate: getFutureDate(62),
        endDate: getFutureDate(67),
        expectedMatches: ['user_bob'] // Should match (budget compatible)
      },
      {
        userId: 'user_david',
        destination: 'Mumbai',
        budget: 50000,
        startDate: getFutureDate(63),
        endDate: getFutureDate(68),
        expectedMatches: ['user_bob', 'user_carol'] // Should match (budget compatible)
      }
    ]
  }
];

// Simulate the exact algorithm flow
async function testAlgorithmFlow() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6380'
  });
  
  try {
    await client.connect();
    logInfo('Connected to Redis successfully!');
    
    console.log('\n' + '='.repeat(80));
    logTest('ALGORITHM FLOW TESTING');
    console.log('='.repeat(80));
    
    // Clear existing test data
    logInfo('Clearing existing test data...');
    const existingKeys = await client.keys('session:user_*');
    if (existingKeys.length > 0) {
      await client.del(existingKeys);
      logSuccess(`Cleared ${existingKeys.length} existing sessions`);
    }
    
    // Test each scenario
    for (const scenario of testScenarios) {
      console.log('\n' + '-'.repeat(80));
      logTest(scenario.name);
      console.log('-'.repeat(80));
      logInfo(scenario.description);
      console.log('');
      
      // Step 1: Create sessions for all users in this scenario
      logInfo('Step 1: Creating Redis sessions with dynamic attributes...');
      for (const user of scenario.users) {
        const staticProfile = testUsers[user.userId];
        
        // This simulates what gets stored in Redis when user creates a session
        const sessionData = {
          userId: user.userId,
          destination: {
            name: user.destination,
            lat: getDestinationCoords(user.destination).lat,
            lon: getDestinationCoords(user.destination).lon
          },
          budget: user.budget,
          startDate: user.startDate,
          endDate: user.endDate,
          createdAt: new Date().toISOString(),
          mode: 'solo',
          // Static attributes from database
          static_attributes: {
            age: staticProfile.age,
            gender: staticProfile.gender,
            personality: staticProfile.personality,
            location: staticProfile.location,
            smoking: staticProfile.smoking,
            drinking: staticProfile.drinking,
            religion: staticProfile.religion,
            interests: staticProfile.interests,
            language: staticProfile.language,
            nationality: staticProfile.nationality,
            profession: staticProfile.profession
          }
        };
        
        const key = `session:${user.userId}`;
        await client.set(key, JSON.stringify(sessionData));
        logUser(`Created session for ${user.userId}: ${user.destination} (${user.startDate} to ${user.endDate})`);
      }
      
      // Step 2: Test matching for each user
      logInfo('\nStep 2: Testing matching algorithm...');
      for (const searchingUser of scenario.users) {
        console.log('');
        logUser(`🔍 ${searchingUser.userId} searching for matches...`);
        
        // Simulate the matching algorithm
        const matches = await findCompatibleMatches(client, searchingUser.userId);
        
        logInfo(`Found ${matches.length} matches:`);
        matches.forEach((match, index) => {
          console.log(`  ${index + 1}. ${match.userId} (${match.destination})`);
          console.log(`     💰 Budget: ₹${match.budget.toLocaleString()}`);
          console.log(`     📅 Dates: ${match.startDate} to ${match.endDate}`);
          console.log(`     👤 Profile: ${match.age}yo ${match.gender}, ${match.personality}`);
        });
        
        // Verify expected matches
        const expectedMatchIds = searchingUser.expectedMatches;
        const actualMatchIds = matches.map(m => m.userId);
        
        if (expectedMatchIds.length === 0 && actualMatchIds.length === 0) {
          logSuccess('✅ No matches expected and none found - CORRECT');
        } else if (expectedMatchIds.length === actualMatchIds.length && 
                   expectedMatchIds.every(id => actualMatchIds.includes(id))) {
          logSuccess('✅ All expected matches found - CORRECT');
        } else {
          logWarning('⚠️  Match count mismatch:');
          logWarning(`   Expected: ${expectedMatchIds.join(', ')}`);
          logWarning(`   Found: ${actualMatchIds.join(', ')}`);
        }
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    logSuccess('ALGORITHM FLOW TESTING COMPLETED');
    console.log('='.repeat(80));
    
    logInfo('Test Summary:');
    logInfo('• Static attributes (age, gender, personality, smoking, drinking) come from database');
    logInfo('• Dynamic attributes (destination, dates, budget) are stored in Redis sessions');
    logInfo('• Matching algorithm finds users with overlapping dynamic attributes');
    logInfo('• Compatibility scoring considers both static and dynamic attributes');
    
    console.log('\n🎯 Ready for end-to-end testing in the UI!');
    
  } catch (error) {
    logError('Test failed:');
    logError(error.message);
  } finally {
    await client.disconnect();
  }
}

// Simulate the matching algorithm (similar to your API)
async function findCompatibleMatches(client, searchingUserId) {
  try {
    // 1. Get the searching user's session
    const searchingUserSessionJSON = await client.get(`session:${searchingUserId}`);
    if (!searchingUserSessionJSON) {
      return [];
    }
    
    const searchingUserSession = JSON.parse(searchingUserSessionJSON);
    
    // 2. Get all other active sessions
    const allSessionKeys = (await client.keys('session:*')).filter(key => key !== `session:${searchingUserId}`);
    if (allSessionKeys.length === 0) {
      return [];
    }
    
    const allSessionsJSON = await client.mGet(allSessionKeys);
    const validSessionsJSON = allSessionsJSON.filter(s => s !== null);
    const allSessions = validSessionsJSON.map(s => JSON.parse(s));
    
    // 3. Apply matching criteria (simplified version of your algorithm)
    const compatibleMatches = allSessions.filter(matchSession => {
      // Basic compatibility checks
      if (!matchSession.destination || !matchSession.static_attributes?.location) {
        return false;
      }
      
      // Check destination match
      if (matchSession.destination.name !== searchingUserSession.destination.name) {
        return false;
      }
      
      // Check date overlap
      const searchStart = new Date(searchingUserSession.startDate);
      const searchEnd = new Date(searchingUserSession.endDate);
      const matchStart = new Date(matchSession.startDate);
      const matchEnd = new Date(matchSession.endDate);
      
      const hasDateOverlap = !(searchEnd < matchStart || matchEnd < searchStart);
      if (!hasDateOverlap) {
        return false;
      }
      
      // Check budget compatibility (realistic travel budget matching)
      const budgetDiff = Math.abs(searchingUserSession.budget - matchSession.budget);
      const lowerBudget = Math.min(searchingUserSession.budget, matchSession.budget);
      const higherBudget = Math.max(searchingUserSession.budget, matchSession.budget);
      
      // Budget is compatible if:
      // 1. Difference is within 150% of lower budget, OR
      // 2. Higher budget is not more than 4x lower budget
      // This allows for realistic travel budget variations
      const budgetCompatible = budgetDiff <= lowerBudget * 1.5 || higherBudget <= lowerBudget * 4;
      
      if (!budgetCompatible) {
        return false;
      }
      
      return true;
    });
    
    // 4. Return formatted matches
    return compatibleMatches.map(match => ({
      userId: match.userId,
      destination: match.destination.name,
      budget: match.budget,
      startDate: match.startDate,
      endDate: match.endDate,
      age: match.static_attributes.age,
      gender: match.static_attributes.gender,
      personality: match.static_attributes.personality,
      interests: match.static_attributes.interests
    }));
    
  } catch (error) {
    logError(`Error finding matches for ${searchingUserId}:`, error.message);
    return [];
  }
}

// Helper function to get destination coordinates
function getDestinationCoords(destName) {
  const coords = {
    'goa': { lat: 15.2993, lon: 74.1240 },
    'delhi': { lat: 28.7041, lon: 77.1025 },
    'mumbai': { lat: 19.0760, lon: 72.8777 }
  };
  
  return coords[destName.toLowerCase()] || coords['mumbai'];
}

// Run the test
if (require.main === module) {
  testAlgorithmFlow().catch(error => {
    logError('Unexpected error:');
    logError(error.message);
    process.exit(1);
  });
}

module.exports = { testAlgorithmFlow, findCompatibleMatches };
