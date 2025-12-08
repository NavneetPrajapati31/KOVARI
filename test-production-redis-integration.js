/**
 * PRODUCTION-READY INTEGRATION TESTS - REDIS SESSION MANAGEMENT
 * Tests Redis session creation, retrieval, and matching workflow
 * Validates real-world scenarios with diverse user data
 */

const { createClient } = require('redis');
require('dotenv').config({ path: '.env.local' });

// Test color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function logTest(message) {
  console.log(`\n${BLUE}${BOLD}TEST:${RESET} ${message}`);
}

function logSuccess(message) {
  console.log(`${GREEN}✓${RESET} ${message}`);
  passedTests++;
  totalTests++;
}

function logFail(message) {
  console.log(`${RED}✗${RESET} ${message}`);
  failedTests++;
  totalTests++;
}

function logInfo(message) {
  console.log(`${YELLOW}ℹ${RESET} ${message}`);
}

function assertTrue(condition, testName) {
  if (condition) {
    logSuccess(`${testName}: PASS`);
  } else {
    logFail(`${testName}: FAIL`);
  }
  return condition;
}

// Test data: Diverse user profiles
const testUsers = [
  {
    userId: 'prod_test_user_1',
    destination: { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    budget: 15000,
    startDate: '2025-02-01',
    endDate: '2025-02-10',
    static_attributes: {
      age: 28,
      gender: 'male',
      personality: 'extrovert',
      interests: ['Adventure', 'Food', 'Nightlife'],
      location: { lat: 28.7041, lon: 77.1025 }, // Delhi
      smoking: 'no',
      drinking: 'yes',
      religion: 'hindu'
    }
  },
  {
    userId: 'prod_test_user_2',
    destination: { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    budget: 12000,
    startDate: '2025-02-05',
    endDate: '2025-02-12',
    static_attributes: {
      age: 26,
      gender: 'female',
      personality: 'ambivert',
      interests: ['Adventure', 'Photography', 'Culture'],
      location: { lat: 12.9716, lon: 77.5946 }, // Bangalore
      smoking: 'no',
      drinking: 'occasionally',
      religion: 'hindu'
    }
  },
  {
    userId: 'prod_test_user_3',
    destination: { name: 'Goa', lat: 15.2993, lon: 74.1240 },
    budget: 20000,
    startDate: '2025-02-01',
    endDate: '2025-02-08',
    static_attributes: {
      age: 32,
      gender: 'male',
      personality: 'introvert',
      interests: ['Beach', 'Music', 'Food'],
      location: { lat: 19.0760, lon: 72.8777 }, // Mumbai
      smoking: 'no',
      drinking: 'yes',
      religion: 'christian'
    }
  },
  {
    userId: 'prod_test_user_4',
    destination: { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
    budget: 8000,
    startDate: '2025-02-10',
    endDate: '2025-02-15',
    static_attributes: {
      age: 24,
      gender: 'female',
      personality: 'extrovert',
      interests: ['Culture', 'History', 'Shopping'],
      location: { lat: 22.5726, lon: 88.3639 }, // Kolkata
      smoking: 'no',
      drinking: 'no',
      religion: 'hindu'
    }
  },
  {
    userId: 'prod_test_user_5',
    destination: { name: 'Pune', lat: 18.5204, lon: 73.8567 }, // ~118km from Mumbai
    budget: 14000,
    startDate: '2025-02-03',
    endDate: '2025-02-09',
    static_attributes: {
      age: 29,
      gender: 'male',
      personality: 'ambivert',
      interests: ['Adventure', 'Food', 'Photography'],
      location: { lat: 28.7041, lon: 77.1025 }, // Delhi
      smoking: 'no',
      drinking: 'yes',
      religion: 'agnostic'
    }
  }
];

// ============================================================================
// TEST SUITE 1: REDIS CONNECTION & HEALTH
// ============================================================================

async function testRedisConnection(redisClient) {
  logTest('TEST SUITE 1: Redis Connection & Health');
  
  try {
    // Test ping
    const pingResponse = await redisClient.ping();
    assertTrue(pingResponse === 'PONG', 'Redis PING successful');
    
    // Test basic set/get
    await redisClient.set('test_key', 'test_value', { EX: 10 });
    const getValue = await redisClient.get('test_key');
    assertTrue(getValue === 'test_value', 'Basic SET/GET works');
    
    // Clean up
    await redisClient.del('test_key');
    
    logInfo('Redis connection healthy ✓');
    
  } catch (error) {
    logFail(`Redis connection failed: ${error.message}`);
    throw error;
  }
}

// ============================================================================
// TEST SUITE 2: SESSION CREATION & STORAGE
// ============================================================================

async function testSessionCreation(redisClient) {
  logTest('TEST SUITE 2: Session Creation & Storage');
  
  // Clean up existing test sessions
  const existingKeys = await redisClient.keys('session:prod_test_*');
  if (existingKeys.length > 0) {
    await redisClient.del(...existingKeys);
    logInfo(`Cleaned up ${existingKeys.length} existing test sessions`);
  }
  
  // Create sessions for all test users
  for (const user of testUsers) {
    try {
      const sessionKey = `session:${user.userId}`;
      const sessionData = {
        userId: user.userId,
        destination: user.destination,
        budget: user.budget,
        startDate: user.startDate,
        endDate: user.endDate,
        static_attributes: user.static_attributes,
        createdAt: new Date().toISOString()
      };
      
      await redisClient.set(sessionKey, JSON.stringify(sessionData), { EX: 86400 }); // 24h TTL
      
      logSuccess(`Created session for ${user.userId}`);
      
    } catch (error) {
      logFail(`Failed to create session for ${user.userId}: ${error.message}`);
    }
  }
  
  // Verify all sessions were created
  const allKeys = await redisClient.keys('session:prod_test_*');
  assertTrue(
    allKeys.length === testUsers.length,
    `All ${testUsers.length} sessions created`
  );
}

// ============================================================================
// TEST SUITE 3: SESSION RETRIEVAL & VALIDATION
// ============================================================================

async function testSessionRetrieval(redisClient) {
  logTest('TEST SUITE 3: Session Retrieval & Validation');
  
  for (const user of testUsers) {
    try {
      const sessionKey = `session:${user.userId}`;
      const sessionJSON = await redisClient.get(sessionKey);
      
      assertTrue(sessionJSON !== null, `Session exists for ${user.userId}`);
      
      if (sessionJSON) {
        const session = JSON.parse(sessionJSON);
        
        // Validate required fields
        assertTrue(
          session.userId === user.userId,
          `User ID matches for ${user.userId}`
        );
        
        assertTrue(
          session.destination !== undefined,
          `Destination exists for ${user.userId}`
        );
        
        assertTrue(
          session.static_attributes !== undefined,
          `Static attributes exist for ${user.userId}`
        );
        
        // Validate TTL
        const ttl = await redisClient.ttl(sessionKey);
        assertTrue(
          ttl > 0 && ttl <= 86400,
          `TTL is valid for ${user.userId} (${ttl}s)`
        );
      }
      
    } catch (error) {
      logFail(`Failed to retrieve session for ${user.userId}: ${error.message}`);
    }
  }
}

// ============================================================================
// TEST SUITE 4: MATCHING LOGIC WITH REAL REDIS DATA
// ============================================================================

async function testMatchingWithRedis(redisClient) {
  logTest('TEST SUITE 4: Matching Logic with Real Redis Data');
  
  // Test case 1: User 1 (Mumbai) should match User 2 (Mumbai) and User 5 (Pune ~118km)
  const user1Session = await redisClient.get('session:prod_test_user_1');
  const user1 = JSON.parse(user1Session);
  
  // Get all other sessions
  const allKeys = await redisClient.keys('session:prod_test_*');
  const otherKeys = allKeys.filter(k => k !== 'session:prod_test_user_1');
  
  let potentialMatches = 0;
  let withinDistanceMatches = 0;
  let dateOverlapMatches = 0;
  
  for (const key of otherKeys) {
    const sessionJSON = await redisClient.get(key);
    const session = JSON.parse(sessionJSON);
    
    // Check distance (200km hard filter)
    const distance = getHaversineDistance(
      user1.destination.lat,
      user1.destination.lon,
      session.destination.lat,
      session.destination.lon
    );
    
    if (distance <= 200) {
      withinDistanceMatches++;
      
      // Check date overlap
      const overlap = calculateDateOverlap(
        user1.startDate,
        user1.endDate,
        session.startDate,
        session.endDate
      );
      
      if (overlap >= 1) {
        dateOverlapMatches++;
        potentialMatches++;
        logInfo(`✓ Match found: ${session.userId} (distance: ${distance.toFixed(1)}km, overlap: ${overlap} days)`);
      }
    }
  }
  
  assertTrue(
    withinDistanceMatches >= 1,
    `User 1 has ${withinDistanceMatches} matches within 200km`
  );
  
  assertTrue(
    dateOverlapMatches >= 1,
    `User 1 has ${dateOverlapMatches} matches with date overlap`
  );
  
  // Test case 2: User 3 (Goa) should have NO matches (too far from Mumbai/Pune/Delhi)
  const user3Session = await redisClient.get('session:prod_test_user_3');
  const user3 = JSON.parse(user3Session);
  
  let user3Matches = 0;
  for (const key of allKeys.filter(k => k !== 'session:prod_test_user_3')) {
    const sessionJSON = await redisClient.get(key);
    const session = JSON.parse(sessionJSON);
    
    const distance = getHaversineDistance(
      user3.destination.lat,
      user3.destination.lon,
      session.destination.lat,
      session.destination.lon
    );
    
    if (distance <= 200) {
      user3Matches++;
    }
  }
  
  assertTrue(
    user3Matches === 0,
    `User 3 (Goa) has no matches beyond 200km (expected 0, got ${user3Matches})`
  );
}

// ============================================================================
// TEST SUITE 5: SESSION EXPIRY & CLEANUP
// ============================================================================

async function testSessionExpiry(redisClient) {
  logTest('TEST SUITE 5: Session Expiry & Cleanup');
  
  // Create a short-lived session
  const testSessionKey = 'session:test_expiry';
  await redisClient.set(testSessionKey, JSON.stringify({ test: 'data' }), { EX: 2 });
  
  // Verify it exists
  const exists = await redisClient.exists(testSessionKey);
  assertTrue(exists === 1, 'Short-lived session created');
  
  // Wait for expiry
  logInfo('Waiting 3 seconds for session to expire...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Verify it's gone
  const existsAfter = await redisClient.exists(testSessionKey);
  assertTrue(existsAfter === 0, 'Session expired correctly');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateDateOverlap(start1, end1, start2, end2) {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();

  const overlapStart = Math.max(s1, s2);
  const overlapEnd = Math.min(e1, e2);
  const overlapDuration = Math.max(0, overlapEnd - overlapStart);
  
  return overlapDuration / (1000 * 60 * 60 * 24);
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllIntegrationTests() {
  console.log(`${BOLD}${'='.repeat(80)}${RESET}`);
  console.log(`${BOLD}${BLUE}PRODUCTION REDIS INTEGRATION TESTS${RESET}`);
  console.log(`${BOLD}${'='.repeat(80)}${RESET}\n`);
  
  let redisClient;
  
  try {
    // Initialize Redis
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error('REDIS_URL not found in environment variables');
    }
    
    logInfo(`Connecting to Redis...`);
    redisClient = createClient({ url: redisUrl });
    
    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });
    
    await redisClient.connect();
    
    logInfo('Redis connected successfully ✓\n');
    
    // Run test suites
    await testRedisConnection(redisClient);
    await testSessionCreation(redisClient);
    await testSessionRetrieval(redisClient);
    await testMatchingWithRedis(redisClient);
    await testSessionExpiry(redisClient);
    
    // Clean up test sessions
    logInfo('\nCleaning up test sessions...');
    const testKeys = await redisClient.keys('session:prod_test_*');
    if (testKeys.length > 0) {
      await redisClient.del(...testKeys);
      logInfo(`Deleted ${testKeys.length} test sessions`);
    }
    
    console.log(`\n${BOLD}${'='.repeat(80)}${RESET}`);
    console.log(`${BOLD}TEST SUMMARY${RESET}`);
    console.log(`${'='.repeat(80)}`);
    console.log(`${GREEN}✓ Passed: ${passedTests}${RESET}`);
    console.log(`${RED}✗ Failed: ${failedTests}${RESET}`);
    console.log(`${BLUE}Total Tests: ${totalTests}${RESET}`);
    
    const passRate = ((passedTests / totalTests) * 100).toFixed(1);
    console.log(`\n${BOLD}Pass Rate: ${passRate}%${RESET}`);
    
    if (failedTests === 0) {
      console.log(`\n${GREEN}${BOLD}🎉 ALL INTEGRATION TESTS PASSED! Redis is production-ready.${RESET}`);
      process.exit(0);
    } else {
      console.log(`\n${RED}${BOLD}⚠️  SOME TESTS FAILED! Review failures before deployment.${RESET}`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error(`\n${RED}${BOLD}FATAL ERROR:${RESET}`, error);
    process.exit(1);
  } finally {
    if (redisClient && redisClient.isOpen) {
      await redisClient.quit();
    }
  }
}

// Run the tests
runAllIntegrationTests().catch(console.error);

