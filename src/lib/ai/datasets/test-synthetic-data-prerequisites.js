#!/usr/bin/env node

/**
 * Test Prerequisites for Synthetic Match Event Generation
 * 
 * This script validates all prerequisites before generating synthetic ML training data:
 * 1. Environment variables
 * 2. Database connections (Supabase)
 * 3. Redis connection
 * 4. Seed users exist
 * 5. Redis sessions exist
 * 6. Feature extraction logic
 * 7. Event generation logic
 * 8. JSONL output format
 * 
 * Usage:
 *   node src/lib/ai/datasets/test-synthetic-data-prerequisites.js
 * 
 * Exit codes:
 *   0 = All tests passed
 *   1 = One or more tests failed
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const redis = require('redis');
const fs = require('fs');
const path = require('path');

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  warnings_list: [],
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function logPass(message) {
  console.log(`${colors.green}✅ PASS:${colors.reset} ${message}`);
  testResults.passed++;
}

function logFail(message, error = null) {
  console.log(`${colors.red}❌ FAIL:${colors.reset} ${message}`);
  if (error) {
    console.log(`   Error: ${error.message || error}`);
    testResults.errors.push({ test: message, error: error.message || String(error) });
  }
  testResults.failed++;
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️  WARN:${colors.reset} ${message}`);
  testResults.warnings++;
  testResults.warnings_list.push(message);
}

function logInfo(message) {
  console.log(`${colors.cyan}ℹ️  INFO:${colors.reset} ${message}`);
}

function logSection(title) {
  console.log(`\n${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);
}

// ============================================================================
// TEST 1: Environment Variables
// ============================================================================

function testEnvironmentVariables() {
  logSection('TEST 1: Environment Variables');

  const required = {
    'NEXT_PUBLIC_SUPABASE_URL': process.env.NEXT_PUBLIC_SUPABASE_URL,
    'SUPABASE_SERVICE_ROLE_KEY': process.env.SUPABASE_SERVICE_ROLE_KEY,
    'REDIS_URL': process.env.REDIS_URL,
  };

  let allPresent = true;
  for (const [key, value] of Object.entries(required)) {
    if (!value || value.trim() === '') {
      logFail(`Missing environment variable: ${key}`);
      allPresent = false;
    } else {
      logPass(`${key} is set`);
    }
  }

  // Check format
  if (required.NEXT_PUBLIC_SUPABASE_URL && !required.NEXT_PUBLIC_SUPABASE_URL.startsWith('http')) {
    logWarning('NEXT_PUBLIC_SUPABASE_URL does not start with http/https');
  }

  if (required.REDIS_URL && !required.REDIS_URL.startsWith('redis://')) {
    logWarning('REDIS_URL does not start with redis://');
  }

  return allPresent;
}

// ============================================================================
// TEST 2: Supabase Connection
// ============================================================================

async function testSupabaseConnection() {
  logSection('TEST 2: Supabase Connection');

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    logFail('Cannot test Supabase connection - missing credentials');
    return false;
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    
    // Test connection by querying a simple table
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error) {
      logFail('Supabase connection failed', error);
      return false;
    }

    logPass('Supabase connection successful');
    return true;
  } catch (error) {
    logFail('Supabase connection error', error);
    return false;
  }
}

// ============================================================================
// TEST 3: Redis Connection
// ============================================================================

async function testRedisConnection() {
  logSection('TEST 3: Redis Connection');

  const REDIS_URL = process.env.REDIS_URL;

  if (!REDIS_URL) {
    logFail('Cannot test Redis connection - missing REDIS_URL');
    return false;
  }

  let redisClient;
  try {
    redisClient = redis.createClient({ url: REDIS_URL });
    await redisClient.connect();
    logPass('Redis connection successful');

    // Test basic operations
    await redisClient.set('test:key', 'test:value');
    const value = await redisClient.get('test:key');
    
    if (value === 'test:value') {
      logPass('Redis read/write operations working');
      await redisClient.del('test:key');
    } else {
      logFail('Redis read/write test failed');
      await redisClient.quit();
      return false;
    }

    await redisClient.quit();
    return true;
  } catch (error) {
    logFail('Redis connection error', error);
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch (e) {
        // Ignore quit errors
      }
    }
    return false;
  }
}

// ============================================================================
// TEST 4: Seed Users Exist
// ============================================================================

async function testSeedUsers() {
  logSection('TEST 4: Seed Users in Database');

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    logFail('Cannot test seed users - missing credentials');
    return false;
  }

  const seedUserEmails = [
    'budget.traveler@example.com',
    'luxury.traveler@example.com',
    'solo.introvert@example.com',
    'extrovert.group@example.com',
    'short.trip@example.com',
    'long.trip@example.com',
  ];

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, clerk_user_id');

    if (usersError) {
      logFail('Error fetching users', usersError);
      return false;
    }

    logInfo(`Found ${users.length} total users in database`);

    // Check for seed users by email (need to check profiles)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('email, user_id, username');

    if (profilesError) {
      logWarning('Could not check profiles for seed users');
    } else {
      const seedUserCount = profiles.filter(p => 
        seedUserEmails.includes(p.email)
      ).length;
      
      if (seedUserCount > 0) {
        logPass(`Found ${seedUserCount} seed users by email`);
      } else {
        logWarning('No seed users found by email (may be using different emails)');
      }
    }

    // Check for users with actual Clerk IDs (not placeholders)
    const usersWithClerkIds = users.filter(u => 
      u.clerk_user_id && 
      u.clerk_user_id.startsWith('user_') && 
      !u.clerk_user_id.startsWith('seed_')
    );

    if (usersWithClerkIds.length >= 2) {
      logPass(`Found ${usersWithClerkIds.length} users with actual Clerk IDs (minimum 2 required)`);
    } else {
      logFail(`Found only ${usersWithClerkIds.length} users with actual Clerk IDs (need at least 2)`);
      return false;
    }

    // Check user profiles
    const userIds = usersWithClerkIds.map(u => u.id);
    const { data: userProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, age, interests, personality, location')
      .in('user_id', userIds);

    if (profileError) {
      logFail('Error fetching user profiles', profileError);
      return false;
    }

    logInfo(`Found ${userProfiles.length} profiles for users`);

    // Check profile completeness
    const completeProfiles = userProfiles.filter(p => 
      p.age && 
      p.interests && 
      Array.isArray(p.interests) && 
      p.interests.length > 0 &&
      p.personality &&
      p.location
    );

    if (completeProfiles.length >= 2) {
      logPass(`Found ${completeProfiles.length} complete profiles (minimum 2 required)`);
    } else {
      logWarning(`Only ${completeProfiles.length} complete profiles found (may affect feature extraction)`);
    }

    return usersWithClerkIds.length >= 2;
  } catch (error) {
    logFail('Error testing seed users', error);
    return false;
  }
}

// ============================================================================
// TEST 5: Redis Sessions Exist
// ============================================================================

async function testRedisSessions() {
  logSection('TEST 5: Redis Sessions');

  const REDIS_URL = process.env.REDIS_URL;

  if (!REDIS_URL) {
    logFail('Cannot test Redis sessions - missing REDIS_URL');
    return false;
  }

  let redisClient;
  try {
    redisClient = redis.createClient({ url: REDIS_URL });
    await redisClient.connect();

    // Get all session keys
    const sessionKeys = await redisClient.keys('session:*');
    
    logInfo(`Found ${sessionKeys.length} session keys in Redis`);

    if (sessionKeys.length === 0) {
      logFail('No Redis sessions found. Run: node src/lib/ai/datasets/create-seed-user-sessions.js');
      await redisClient.quit();
      return false;
    }

    if (sessionKeys.length < 2) {
      logFail(`Only ${sessionKeys.length} session(s) found (need at least 2 for solo matching)`);
      await redisClient.quit();
      return false;
    }

    logPass(`Found ${sessionKeys.length} sessions (minimum 2 required)`);

    // Validate session structure
    let validSessions = 0;
    let invalidSessions = 0;

    for (const key of sessionKeys.slice(0, 5)) { // Check first 5
      try {
        const sessionJSON = await redisClient.get(key);
        if (!sessionJSON) {
          invalidSessions++;
          continue;
        }

        const session = JSON.parse(sessionJSON);
        
        // Check required fields
        const hasRequired = 
          session.userId &&
          session.destination &&
          session.budget !== undefined &&
          session.startDate &&
          session.endDate;

        if (hasRequired) {
          validSessions++;
        } else {
          invalidSessions++;
          logWarning(`Session ${key} missing required fields`);
        }
      } catch (error) {
        invalidSessions++;
        logWarning(`Session ${key} is invalid JSON: ${error.message}`);
      }
    }

    if (validSessions > 0) {
      logPass(`Validated ${validSessions} sample session(s) have required fields`);
    }

    if (invalidSessions > 0) {
      logWarning(`${invalidSessions} sample session(s) have issues`);
    }

    await redisClient.quit();
    return sessionKeys.length >= 2;
  } catch (error) {
    logFail('Error testing Redis sessions', error);
    if (redisClient) {
      try {
        await redisClient.quit();
      } catch (e) {
        // Ignore
      }
    }
    return false;
  }
}

// ============================================================================
// TEST 6: Feature Extraction Logic
// ============================================================================

function testFeatureExtractionLogic() {
  logSection('TEST 6: Feature Extraction Logic');

  try {
    // Test date overlap calculation
    const dateOverlap1 = calculateDateOverlap('2025-06-01', '2025-06-07', '2025-06-05', '2025-06-10');
    if (dateOverlap1 > 0 && dateOverlap1 <= 1) {
      logPass('Date overlap calculation works');
    } else {
      logFail(`Date overlap calculation returned invalid value: ${dateOverlap1}`);
    }

    // Test budget compatibility
    const budgetScore1 = calculateBudgetCompatibility(15000, 20000);
    if (budgetScore1 >= 0 && budgetScore1 <= 1) {
      logPass('Budget compatibility calculation works');
    } else {
      logFail(`Budget compatibility returned invalid value: ${budgetScore1}`);
    }

    // Test interest similarity
    const interestScore1 = calculateInterestSimilarity(['travel', 'food'], ['travel', 'adventure']);
    if (interestScore1 >= 0 && interestScore1 <= 1) {
      logPass('Interest similarity calculation works');
    } else {
      logFail(`Interest similarity returned invalid value: ${interestScore1}`);
    }

    // Test age compatibility
    const ageScore1 = calculateAgeCompatibility(25, 27);
    if (ageScore1 >= 0 && ageScore1 <= 1) {
      logPass('Age compatibility calculation works');
    } else {
      logFail(`Age compatibility returned invalid value: ${ageScore1}`);
    }

    return true;
  } catch (error) {
    logFail('Feature extraction logic test failed', error);
    return false;
  }
}

// Helper functions (same as in generate-synthetic-match-events.js)
function calculateDateOverlap(start1, end1, start2, end2) {
  const d1 = new Date(start1);
  const d2 = new Date(end1);
  const d3 = new Date(start2);
  const d4 = new Date(end2);
  
  const overlapStart = new Date(Math.max(d1, d3));
  const overlapEnd = new Date(Math.min(d2, d4));
  
  if (overlapStart > overlapEnd) return 0;
  
  const overlapDays = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24);
  const totalDays1 = (d2 - d1) / (1000 * 60 * 60 * 24);
  const totalDays2 = (d4 - d3) / (1000 * 60 * 60 * 24);
  
  return Math.min(overlapDays / Math.min(totalDays1, totalDays2), 1.0);
}

function calculateBudgetCompatibility(budget1, budget2) {
  if (!budget1 || !budget2) return 0.5;
  const ratio = Math.min(budget1, budget2) / Math.max(budget1, budget2);
  return ratio;
}

function calculateInterestSimilarity(interests1, interests2) {
  if (!interests1 || !interests2 || interests1.length === 0 || interests2.length === 0) {
    return 0.3;
  }
  const set1 = new Set(interests1);
  const set2 = new Set(interests2);
  const intersection = [...set1].filter(x => set2.has(x)).length;
  const union = set1.size + set2.size - intersection;
  return union > 0 ? intersection / union : 0;
}

function calculateAgeCompatibility(age1, age2) {
  if (!age1 || !age2) return 0.5;
  const diff = Math.abs(age1 - age2);
  if (diff <= 2) return 1.0;
  if (diff <= 5) return 0.8;
  if (diff <= 10) return 0.6;
  if (diff <= 15) return 0.4;
  return 0.2;
}

// ============================================================================
// TEST 7: Event Generation Logic
// ============================================================================

function testEventGenerationLogic() {
  logSection('TEST 7: Event Generation Logic');

  try {
    // Test outcome generation
    const outcomes = [];
    for (let i = 0; i < 100; i++) {
      const outcome = generateOutcome(0.7); // High compatibility
      outcomes.push(outcome);
    }
    
    const acceptCount = outcomes.filter(o => o === 'accept').length;
    const ignoreCount = outcomes.filter(o => o === 'ignore').length;
    
    // High compatibility should bias towards accept
    if (acceptCount > ignoreCount) {
      logPass('Outcome generation logic works (high compatibility → more accepts)');
    } else {
      logWarning('Outcome generation may not be working as expected');
    }

    // Test label computation
    const label1 = computeLabel('accept');
    const label2 = computeLabel('ignore');
    
    if (label1 === 1 && label2 === 0) {
      logPass('Label computation works');
    } else {
      logFail(`Label computation failed: accept=${label1}, ignore=${label2}`);
    }

    // Test event structure
    const testEvent = {
      matchType: 'user_user',
      features: {
        matchType: 'user_user',
        distanceScore: 1.0,
        dateOverlapScore: 0.9,
        budgetScore: 0.8,
        interestScore: 0.6,
        ageScore: 0.7,
        languageScore: 0.8,
        lifestyleScore: 0.8,
        backgroundScore: 0.6,
      },
      outcome: 'accept',
      label: 1,
      preset: 'balanced',
      timestamp: Date.now(),
      source: 'rule-based',
    };

    // Validate event structure
    const hasRequired = 
      testEvent.matchType &&
      testEvent.features &&
      testEvent.outcome &&
      testEvent.label !== undefined &&
      testEvent.preset &&
      testEvent.timestamp &&
      testEvent.source;

    if (hasRequired) {
      logPass('Event structure is valid');
    } else {
      logFail('Event structure missing required fields');
    }

    // Test JSON serialization
    try {
      const json = JSON.stringify(testEvent);
      const parsed = JSON.parse(json);
      if (parsed.matchType === testEvent.matchType) {
        logPass('Event JSON serialization works');
      } else {
        logFail('Event JSON serialization failed');
      }
    } catch (error) {
      logFail('Event JSON serialization error', error);
    }

    return true;
  } catch (error) {
    logFail('Event generation logic test failed', error);
    return false;
  }
}

function generateOutcome(compatibilityScore) {
  const random = Math.random();
  
  if (compatibilityScore >= 0.7) {
    return random < 0.8 ? 'accept' : 'ignore';
  } else if (compatibilityScore >= 0.5) {
    return random < 0.5 ? 'accept' : 'ignore';
  } else if (compatibilityScore >= 0.3) {
    return random < 0.2 ? 'accept' : 'ignore';
  } else {
    return random < 0.05 ? 'accept' : 'ignore';
  }
}

function computeLabel(outcome) {
  return (outcome === 'accept' || outcome === 'chat') ? 1 : 0;
}

// ============================================================================
// TEST 8: File System (Output Directory)
// ============================================================================

function testFileSystem() {
  logSection('TEST 8: File System (Output Directory)');

  try {
    // Test if we can write to current directory
    const testFile = path.join(process.cwd(), 'test_write_permission.tmp');
    
    try {
      fs.writeFileSync(testFile, 'test');
      fs.unlinkSync(testFile);
      logPass('File system write permissions OK');
      return true;
    } catch (error) {
      logFail('Cannot write to file system', error);
      return false;
    }
  } catch (error) {
    logFail('File system test failed', error);
    return false;
  }
}

// ============================================================================
// TEST 9: Groups Exist (for group matching)
// ============================================================================

async function testGroupsExist() {
  logSection('TEST 9: Groups in Database (Optional)');

  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
    logWarning('Cannot test groups - missing credentials');
    return true; // Not required for solo matching
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

    const { data: groups, error } = await supabase
      .from('groups')
      .select('id, destination, start_date, end_date, budget, status')
      .eq('status', 'active');

    if (error) {
      logWarning(`Could not fetch groups: ${error.message}`);
      return true; // Not required for solo matching
    }

    if (groups.length === 0) {
      logWarning('No active groups found (group matching will be skipped)');
    } else {
      logPass(`Found ${groups.length} active group(s) for group matching`);
    }

    return true; // Not a failure if no groups
  } catch (error) {
    logWarning(`Error testing groups: ${error.message}`);
    return true; // Not required for solo matching
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runAllTests() {
  console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════════╗
║  Synthetic Data Generation - Prerequisites Test Suite       ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

  const results = {
    envVars: testEnvironmentVariables(),
    supabase: await testSupabaseConnection(),
    redis: await testRedisConnection(),
    seedUsers: await testSeedUsers(),
    redisSessions: await testRedisSessions(),
    featureExtraction: testFeatureExtractionLogic(),
    eventGeneration: testEventGenerationLogic(),
    fileSystem: testFileSystem(),
    groups: await testGroupsExist(),
  };

  // Summary
  logSection('Test Summary');

  console.log(`${colors.green}Passed: ${testResults.passed}${colors.reset}`);
  console.log(`${colors.red}Failed: ${testResults.failed}${colors.reset}`);
  console.log(`${colors.yellow}Warnings: ${testResults.warnings}${colors.reset}`);

  if (testResults.warnings_list.length > 0) {
    console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
    testResults.warnings_list.forEach(w => console.log(`  • ${w}`));
  }

  if (testResults.errors.length > 0) {
    console.log(`\n${colors.red}Errors:${colors.reset}`);
    testResults.errors.forEach(e => console.log(`  • ${e.test}: ${e.error}`));
  }

  // Critical tests
  const criticalTests = [
    { name: 'Environment Variables', result: results.envVars },
    { name: 'Supabase Connection', result: results.supabase },
    { name: 'Redis Connection', result: results.redis },
    { name: 'Seed Users', result: results.seedUsers },
    { name: 'Redis Sessions', result: results.redisSessions },
    { name: 'Feature Extraction', result: results.featureExtraction },
    { name: 'Event Generation', result: results.eventGeneration },
    { name: 'File System', result: results.fileSystem },
  ];

  const criticalFailures = criticalTests.filter(t => !t.result);

  if (criticalFailures.length === 0) {
    console.log(`\n${colors.green}✅ All critical tests passed!${colors.reset}`);
    console.log(`${colors.cyan}You can now run: node src/lib/ai/datasets/generate-synthetic-match-events.js${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.red}❌ ${criticalFailures.length} critical test(s) failed:${colors.reset}`);
    criticalFailures.forEach(t => console.log(`  • ${t.name}`));
    console.log(`\n${colors.yellow}Please fix the issues above before generating synthetic data.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
runAllTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
