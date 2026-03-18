/**
 * ML Performance Testing via API
 * 
 * This script tests ML model performance by making actual API calls
 * and monitoring the server logs for ML vs rule-based score comparisons.
 */

const { createClient } = require('@supabase/supabase-js');
const { createClient: createRedisClient } = require('redis');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

let redisClient;

async function connectRedis() {
  if (!redisClient) {
    redisClient = createRedisClient({
      url: process.env.REDIS_URL,
    });
    await redisClient.connect();
  }
  return redisClient;
}

async function getAllSessions() {
  const client = await connectRedis();
  const keys = await client.keys('session:*');
  const sessions = await client.mGet(keys);
  return sessions
    .map((s, i) => {
      if (!s) return null;
      try {
        return { key: keys[i], session: JSON.parse(s) };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

async function testMLPerformance() {
  console.log('🧪 ML Model Performance Testing via API\n');
  console.log('='.repeat(80));
  console.log('📋 Instructions:');
  console.log('1. Make sure your server is running (npm run dev)');
  console.log('2. Watch the server logs for ML scoring output');
  console.log('3. Look for lines like: 🤖 ML Scoring: Rule-based=X.XXX, ML=Y.YYY, Blended=Z.ZZZ');
  console.log('='.repeat(80));

  const allSessions = await getAllSessions();
  console.log(`\n📊 Found ${allSessions.length} sessions in Redis\n`);

  if (allSessions.length < 2) {
    console.log('❌ Need at least 2 sessions to test. Please create test data first.');
    await redisClient?.quit();
    return;
  }

  // Get a few test users
  const testUsers = allSessions.slice(0, 5);
  
  console.log('🔍 Test Users:');
  testUsers.forEach((user, idx) => {
    const userId = user.key.replace('session:', '');
    const session = user.session;
    console.log(`  ${idx + 1}. ${userId.substring(0, 30)}...`);
    console.log(`     Destination: ${session.destination?.name || 'N/A'}`);
    console.log(`     Dates: ${session.startDate} to ${session.endDate}`);
    console.log(`     Budget: ₹${session.budget?.toLocaleString() || 'N/A'}`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('📝 API Test URLs:');
  console.log('='.repeat(80));
  
  testUsers.forEach((user, idx) => {
    const userId = user.key.replace('session:', '');
    console.log(`\nTest ${idx + 1}:`);
    console.log(`  GET http://localhost:3000/api/match-solo?userId=${userId}`);
    console.log(`  User: ${userId.substring(0, 30)}...`);
  });

  console.log('\n' + '='.repeat(80));
  console.log('💡 How to Test:');
  console.log('='.repeat(80));
  console.log('1. Open your browser or use curl/Postman');
  console.log('2. Make GET requests to the URLs above');
  console.log('3. Watch your server terminal for ML scoring logs');
  console.log('4. Look for these log patterns:');
  console.log('   - 🤖 ML Scoring: Rule-based=X.XXX, ML=Y.YYY, Blended=Z.ZZZ');
  console.log('   - ⚠️  ML scoring unavailable, using rule-based: X.XXX');
  console.log('\n5. Compare the scores:');
  console.log('   - Rule-based: Traditional algorithm score');
  console.log('   - ML: Pure ML model prediction');
  console.log('   - Blended: Final score (70% ML + 30% rule-based)');
  console.log('   - Difference: How much ML changed the score');

  console.log('\n' + '='.repeat(80));
  console.log('📊 Expected Output Format:');
  console.log('='.repeat(80));
  console.log('🤖 ML Scoring: Rule-based=0.625, ML=0.470, Blended=0.519 (-0.106, -17.0%)');
  console.log('   ^^^^^^^^^^  ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^');
  console.log('   |           |');
  console.log('   |           +-- Shows rule-based, ML, blended scores and difference');
  console.log('   +-- Indicates ML scoring was used');

  console.log('\n' + '='.repeat(80));
  console.log('✅ Ready to test!');
  console.log('='.repeat(80));
  console.log('\nMake API requests and watch your server logs for ML performance data.\n');

  await redisClient?.quit();
}

testMLPerformance().catch(console.error);
