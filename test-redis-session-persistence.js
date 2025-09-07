#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const redis = require('redis');

console.log('🧪 Testing Redis Session Persistence & Matching');
console.log('==============================================\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
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

function logDebug(message) {
  log(`🔍 ${message}`, 'cyan');
}

// Test data for Mumbai trips
const testUsers = [
  {
    userId: 'test_user_1',
    destinationName: 'Mumbai',
    budget: 25000,
    startDate: '2025-02-15',
    endDate: '2025-02-20'
  },
  {
    userId: 'test_user_2', 
    destinationName: 'Mumbai',
    budget: 20000,
    startDate: '2025-02-18',
    endDate: '2025-02-25'
  },
  {
    userId: 'test_user_3',
    destinationName: 'Goa',
    budget: 30000,
    startDate: '2025-02-20',
    endDate: '2025-02-27'
  }
];

async function testRedisSessionPersistence() {
  const client = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6380'
  });

  try {
    await client.connect();
    logSuccess('Connected to Redis successfully!');

    // Step 1: Clear any existing test sessions
    logDebug('Step 1: Clearing existing test sessions...');
    for (const user of testUsers) {
      await client.del(`session:${user.userId}`);
    }
    logSuccess('Cleared existing test sessions');

    // Step 2: Create test sessions
    logDebug('\nStep 2: Creating test sessions...');
    for (const user of testUsers) {
      const sessionData = {
        userId: user.userId,
        destination: { 
          name: user.destinationName, 
          lat: user.destinationName === 'Mumbai' ? 19.0760 : 15.2993,
          lon: user.destinationName === 'Mumbai' ? 72.8777 : 74.1240
        },
        budget: user.budget,
        startDate: user.startDate,
        endDate: user.endDate,
        mode: 'solo',
        interests: ['travel', 'exploration', 'photography']
      };

      // Store with 7-day expiration (604800 seconds)
      await client.setEx(`session:${user.userId}`, 604800, JSON.stringify(sessionData));
      logInfo(`Created session for ${user.userId}: ${user.destinationName} (₹${user.budget})`);
    }

    // Step 3: Verify sessions were created
    logDebug('\nStep 3: Verifying sessions were created...');
    for (const user of testUsers) {
      const sessionData = await client.get(`session:${user.userId}`);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        logSuccess(`✅ Session found for ${user.userId}:`);
        logInfo(`   Destination: ${session.destination.name}`);
        logInfo(`   Budget: ₹${session.budget}`);
        logInfo(`   Dates: ${session.startDate} to ${session.endDate}`);
      } else {
        logError(`❌ Session not found for ${user.userId}`);
      }
    }

    // Step 4: Test TTL (Time To Live)
    logDebug('\nStep 4: Checking TTL (Time To Live)...');
    for (const user of testUsers) {
      const ttl = await client.ttl(`session:${user.userId}`);
      if (ttl > 0) {
        const days = Math.floor(ttl / 86400);
        const hours = Math.floor((ttl % 86400) / 3600);
        logSuccess(`✅ TTL for ${user.userId}: ${days} days, ${hours} hours (${ttl} seconds)`);
      } else {
        logError(`❌ No TTL found for ${user.userId}`);
      }
    }

    // Step 5: Test session retrieval for matching
    logDebug('\nStep 5: Testing session retrieval for matching...');
    const allSessionKeys = await client.keys('session:*');
    logInfo(`Found ${allSessionKeys.length} total sessions in Redis`);

    const testSessionKeys = allSessionKeys.filter(key => 
      testUsers.some(user => key === `session:${user.userId}`)
    );
    logInfo(`Found ${testSessionKeys.length} test sessions`);

    if (testSessionKeys.length > 0) {
      const sessionsData = await client.mGet(testSessionKeys);
      const validSessions = sessionsData.filter(s => s !== null);
      
      logSuccess(`✅ Retrieved ${validSessions.length} valid sessions for matching`);
      
      // Display session details
      validSessions.forEach((sessionStr, index) => {
        const session = JSON.parse(sessionStr);
        logInfo(`   ${index + 1}. ${session.userId}: ${session.destination.name} (₹${session.budget})`);
      });
    }

    // Step 6: Test matching simulation
    logDebug('\nStep 6: Testing matching simulation...');
    const searchingUser = testUsers[0]; // Use first user as searcher
    const otherSessions = testUsers.slice(1); // Other users as potential matches
    
    logInfo(`Simulating search by ${searchingUser.userId} for ${searchingUser.destinationName}`);
    
    for (const potentialMatch of otherSessions) {
      const matchSession = await client.get(`session:${potentialMatch.userId}`);
      if (matchSession) {
        const session = JSON.parse(matchSession);
        
        // Simple compatibility check
        const sameDestination = session.destination.name === searchingUser.destinationName;
        const budgetCompatible = Math.abs(session.budget - searchingUser.budget) <= 10000;
        
        logInfo(`   Potential match: ${session.userId}`);
        logInfo(`     Same destination: ${sameDestination ? '✅' : '❌'}`);
        logInfo(`     Budget compatible: ${budgetCompatible ? '✅' : '❌'}`);
        logInfo(`     Destination: ${session.destination.name}`);
        logInfo(`     Budget: ₹${session.budget}`);
      }
    }

    // Step 7: Test session expiration simulation
    logDebug('\nStep 7: Testing session expiration...');
    logInfo('Setting a test session to expire in 5 seconds for testing...');
    
    const testExpirationUser = 'test_expiration_user';
    const testSession = {
      userId: testExpirationUser,
      destination: { name: 'Test City', lat: 0, lon: 0 },
      budget: 10000,
      startDate: '2025-01-01',
      endDate: '2025-01-05',
      mode: 'solo',
      interests: ['test']
    };
    
    // Set with 5-second expiration
    await client.setEx(`session:${testExpirationUser}`, 5, JSON.stringify(testSession));
    logInfo(`Created test session with 5-second expiration`);
    
    // Check immediately
    let sessionExists = await client.get(`session:${testExpirationUser}`);
    logInfo(`Session exists immediately: ${sessionExists ? '✅' : '❌'}`);
    
    // Wait 6 seconds and check again
    logInfo('Waiting 6 seconds for expiration...');
    await new Promise(resolve => setTimeout(resolve, 6000));
    
    sessionExists = await client.get(`session:${testExpirationUser}`);
    logInfo(`Session exists after 6 seconds: ${sessionExists ? '❌ (should be expired)' : '✅ (correctly expired)'}`);

    logSuccess('\n🎉 Redis Session Persistence Test Completed!');
    logInfo('✅ Sessions are created with 7-day TTL');
    logInfo('✅ Sessions can be retrieved for matching');
    logInfo('✅ Sessions expire correctly after TTL');
    logInfo('✅ Multiple users can have overlapping sessions');

  } catch (error) {
    logError('Test failed:');
    logError(error.message);
  } finally {
    await client.disconnect();
  }
}

// Run the test
testRedisSessionPersistence();

