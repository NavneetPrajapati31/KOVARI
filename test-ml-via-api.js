/**
 * ML Performance Testing via Actual API Calls
 * 
 * This script makes real API requests and monitors ML vs rule-based scoring
 */

const { createClient } = require('@supabase/supabase-js');
const { createClient: createRedisClient } = require('redis');
const http = require('http');
require('dotenv').config({ path: '.env.local' });

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

function makeAPIRequest(userId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/match-solo?userId=${encodeURIComponent(userId)}`,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({ status: res.statusCode, data: jsonData });
        } catch (error) {
          resolve({ status: res.statusCode, data: data, error: error.message });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function testMLViaAPI() {
  console.log('🧪 ML Model Performance Testing via API\n');
  console.log('='.repeat(80));
  console.log('⚠️  Make sure your server is running on http://localhost:3000');
  console.log('='.repeat(80));

  const allSessions = await getAllSessions();
  console.log(`\n📊 Found ${allSessions.length} sessions in Redis\n`);

  if (allSessions.length < 2) {
    console.log('❌ Need at least 2 sessions to test. Please create test data first.');
    await redisClient?.quit();
    return;
  }

  // Test with a few users
  const testUsers = allSessions.slice(0, 5);
  const results = [];

  console.log('🔍 Testing ML Performance...\n');

  for (let i = 0; i < testUsers.length; i++) {
    const user = testUsers[i];
    const userId = user.key.replace('session:', '');
    const session = user.session;

    console.log(`${'='.repeat(80)}`);
    console.log(`Test ${i + 1}/${testUsers.length}: ${userId.substring(0, 30)}...`);
    console.log(`  Destination: ${session.destination?.name || 'N/A'}`);
    console.log(`  Dates: ${session.startDate} to ${session.endDate}`);
    console.log(`  Budget: ₹${session.budget?.toLocaleString() || 'N/A'}`);

    try {
      console.log(`  Making API request...`);
      const response = await makeAPIRequest(userId);

      if (response.status === 200) {
        const matches = Array.isArray(response.data) ? response.data : [];
        console.log(`  ✅ Found ${matches.length} matches`);

        if (matches.length > 0) {
          matches.forEach((match, idx) => {
            console.log(`    Match ${idx + 1}: Score=${match.score?.toFixed(3) || 'N/A'}`);
            if (match.mlScore !== undefined) {
              console.log(`      ML Score: ${match.mlScore.toFixed(3)}`);
            }
          });

          results.push({
            userId: userId.substring(0, 30),
            matchesFound: matches.length,
            topScore: matches[0]?.score || 0,
            mlScore: matches[0]?.mlScore,
            hasML: matches[0]?.mlScore !== undefined,
          });
        } else {
          console.log(`  ⚠️  No matches found (all filtered by hard filters)`);
          results.push({
            userId: userId.substring(0, 30),
            matchesFound: 0,
            topScore: 0,
            mlScore: undefined,
            hasML: false,
          });
        }
      } else {
        console.log(`  ❌ API Error: ${response.status}`);
        console.log(`  Response: ${JSON.stringify(response.data).substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
      if (error.message.includes('ECONNREFUSED')) {
        console.log(`  💡 Make sure your server is running: npm run dev`);
      }
    }

    // Small delay between requests
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('='.repeat(80));

  const totalTests = results.length;
  const withMatches = results.filter((r) => r.matchesFound > 0).length;
  const withML = results.filter((r) => r.hasML).length;

  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Tests with Matches: ${withMatches} (${((withMatches / totalTests) * 100).toFixed(1)}%)`);
  console.log(`Tests with ML Scoring: ${withML} (${((withML / totalTests) * 100).toFixed(1)}%)`);

  if (withML > 0) {
    const mlResults = results.filter((r) => r.hasML);
    console.log(`\n📈 ML Scoring Results:`);
    mlResults.forEach((r) => {
      console.log(`  ${r.userId}: Score=${r.topScore.toFixed(3)}, ML=${r.mlScore.toFixed(3)}`);
    });
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log('💡 Note: Check your server logs for detailed ML vs rule-based comparisons!');
  console.log('   Look for: 🤖 ML Scoring: Rule-based=X.XXX, ML=Y.YYY, Blended=Z.ZZZ');
  console.log('='.repeat(80));

  await redisClient?.quit();
}

testMLViaAPI().catch(console.error);
