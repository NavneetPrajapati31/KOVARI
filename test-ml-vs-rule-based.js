/**
 * ML Model Performance Testing Script
 * 
 * This script tests the ML model by:
 * 1. Running multiple searches with different scenarios
 * 2. Comparing ML scores vs rule-based scores
 * 3. Showing performance differences
 * 4. Generating a detailed report
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

async function getSession(userId) {
  const client = await connectRedis();
  const sessionJson = await client.get(`session:${userId}`);
  return sessionJson ? JSON.parse(sessionJson) : null;
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

// Import the scoring functions
async function calculateRuleBasedScore(userSession, matchSession) {
  // This is a simplified version - in production, import from solo.ts
  const weights = {
    destination: 0.25,
    dateOverlap: 0.2,
    budget: 0.2,
    interests: 0.1,
    age: 0.1,
    personality: 0.05,
    locationOrigin: 0.05,
    lifestyle: 0.03,
    religion: 0.02,
  };

  // Simplified scoring (you'd use actual functions in production)
  const destinationScore = 1.0; // Assume same city for now
  const dateOverlapScore = calculateDateOverlap(userSession, matchSession);
  const budgetScore = calculateBudget(userSession.budget, matchSession.budget);
  const interestScore = 0.5; // Default
  const ageScore = 0.5; // Default
  const personalityScore = 0.5; // Default
  const locationOriginScore = 0.5; // Default
  const lifestyleScore = 0.5; // Default
  const religionScore = 0.5; // Default

  return (
    destinationScore * weights.destination +
    dateOverlapScore * weights.dateOverlap +
    budgetScore * weights.budget +
    interestScore * weights.interests +
    ageScore * weights.age +
    personalityScore * weights.personality +
    locationOriginScore * weights.locationOrigin +
    lifestyleScore * weights.lifestyle +
    religionScore * weights.religion
  );
}

function calculateDateOverlap(userSession, matchSession) {
  const s1 = new Date(userSession.startDate).getTime();
  const e1 = new Date(userSession.endDate).getTime();
  const s2 = new Date(matchSession.startDate).getTime();
  const e2 = new Date(matchSession.endDate).getTime();

  const overlapStart = Math.max(s1, s2);
  const overlapEnd = Math.min(e1, e2);
  const overlapMs = Math.max(0, overlapEnd - overlapStart);
  const overlapDays = overlapMs / (1000 * 60 * 60 * 24);

  if (overlapDays < 1) return 0;

  const userTripDays = (e1 - s1) / (1000 * 60 * 60 * 24);
  const ratio = overlapDays / userTripDays;

  if (ratio >= 0.8) return 1.0;
  if (ratio >= 0.5) return 0.9;
  if (ratio >= 0.3) return 0.8;
  if (ratio >= 0.2) return 0.6;
  if (ratio >= 0.1) return 0.3;
  return 0.1;
}

function calculateBudget(userBudget, matchBudget) {
  const diff = Math.abs(userBudget - matchBudget);
  const maxBudget = Math.max(userBudget, matchBudget);
  const ratio = diff / maxBudget;

  if (ratio <= 0.1) return 1.0;
  if (ratio <= 0.25) return 0.8;
  if (ratio <= 0.5) return 0.6;
  return 0.0;
}

async function getMLScore(userSession, matchSession) {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    const path = require('path');

    // Extract features (simplified)
    const features = {
      matchType: 'user_user',
      distanceScore: 1.0, // Same city
      dateOverlapScore: calculateDateOverlap(userSession, matchSession),
      budgetScore: calculateBudget(userSession.budget, matchSession.budget),
      interestScore: 0.5,
      ageScore: 0.5,
      personalityScore: 0.5,
      languageScore: 0,
      lifestyleScore: 0,
      backgroundScore: 0,
    };

    const featuresJson = JSON.stringify(features);
    const scriptPath = path.join(process.cwd(), 'src/lib/ai/datasets/predict.py');
    const modelPath = path.join(process.cwd(), 'models');

    const { stdout } = await execAsync(
      `python "${scriptPath}" --model-dir "${modelPath}"`,
      { input: featuresJson, maxBuffer: 1024 * 1024, timeout: 5000 }
    );

    const result = JSON.parse(stdout.trim());
    return result.success ? result.score : null;
  } catch (error) {
    return null;
  }
}

async function testMLvsRuleBased() {
  console.log('🧪 ML Model Performance Testing\n');
  console.log('='.repeat(80));

  const allSessions = await getAllSessions();
  console.log(`\n📊 Found ${allSessions.length} sessions in Redis\n`);

  if (allSessions.length < 2) {
    console.log('❌ Need at least 2 sessions to test. Please create test data first.');
    return;
  }

  const results = [];
  let testCount = 0;
  const maxTests = Math.min(10, allSessions.length - 1); // Test up to 10 searches

  for (let i = 0; i < maxTests; i++) {
    const userSessionData = allSessions[i];
    if (!userSessionData) continue;

    const userSession = userSessionData.session;
    const userId = userSessionData.key.replace('session:', '');

    console.log(`\n${'='.repeat(80)}`);
    console.log(`Test ${++testCount}: User ${userId.substring(0, 20)}...`);
    console.log(`  Destination: ${userSession.destination?.name || 'N/A'}`);
    console.log(`  Dates: ${userSession.startDate} to ${userSession.endDate}`);
    console.log(`  Budget: ₹${userSession.budget?.toLocaleString() || 'N/A'}`);

    // Find compatible matches
    const compatibleMatches = [];

    for (let j = 0; j < allSessions.length; j++) {
      if (i === j) continue; // Skip self

      const matchSessionData = allSessions[j];
      const matchSession = matchSessionData.session;
      const matchUserId = matchSessionData.key.replace('session:', '');

      // Check basic compatibility
      if (!userSession.destination || !matchSession.destination) continue;

      // Check date overlap
      const dateOverlap = calculateDateOverlap(userSession, matchSession);
      if (dateOverlap === 0) continue;

      // Check distance (simplified - assume same city if both have destinations)
      const distanceScore = 1.0; // Simplified

      if (dateOverlap > 0 && distanceScore > 0) {
        compatibleMatches.push({
          userId: matchUserId,
          session: matchSession,
        });
      }
    }

    console.log(`  Found ${compatibleMatches.length} compatible matches`);

    // Test each compatible match
    for (const match of compatibleMatches.slice(0, 5)) {
      // Calculate rule-based score
      const ruleBasedScore = await calculateRuleBasedScore(
        userSession,
        match.session
      );

      // Calculate ML score
      const mlScore = await getMLScore(userSession, match.session);

      // Calculate blended score (70% ML + 30% rule-based)
      const blendedScore =
        mlScore !== null
          ? mlScore * 0.7 + ruleBasedScore * 0.3
          : ruleBasedScore;

      const difference = mlScore !== null ? blendedScore - ruleBasedScore : 0;
      const percentChange =
        mlScore !== null
          ? ((blendedScore - ruleBasedScore) / ruleBasedScore) * 100
          : 0;

      results.push({
        testNumber: testCount,
        user: userId.substring(0, 20),
        match: match.userId.substring(0, 20),
        userDestination: userSession.destination?.name || 'N/A',
        matchDestination: match.session.destination?.name || 'N/A',
        userDates: `${userSession.startDate} to ${userSession.endDate}`,
        matchDates: `${match.session.startDate} to ${match.session.endDate}`,
        ruleBasedScore: ruleBasedScore.toFixed(3),
        mlScore: mlScore !== null ? mlScore.toFixed(3) : 'N/A',
        blendedScore: blendedScore.toFixed(3),
        difference: difference.toFixed(3),
        percentChange: percentChange.toFixed(1),
        mlAvailable: mlScore !== null,
      });

      console.log(`    Match: ${match.userId.substring(0, 20)}...`);
      console.log(`      Rule-based: ${ruleBasedScore.toFixed(3)}`);
      console.log(
        `      ML score: ${mlScore !== null ? mlScore.toFixed(3) : 'N/A (fallback)'}`
      );
      console.log(`      Blended: ${blendedScore.toFixed(3)}`);
      if (mlScore !== null) {
        console.log(
          `      Difference: ${difference >= 0 ? '+' : ''}${difference.toFixed(3)} (${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}%)`
        );
      }
    }
  }

  // Generate summary report
  console.log(`\n${'='.repeat(80)}`);
  console.log('📊 PERFORMANCE SUMMARY');
  console.log('='.repeat(80));

  const mlAvailableCount = results.filter((r) => r.mlAvailable).length;
  const mlUnavailableCount = results.length - mlAvailableCount;

  console.log(`\nTotal Comparisons: ${results.length}`);
  console.log(`ML Available: ${mlAvailableCount} (${((mlAvailableCount / results.length) * 100).toFixed(1)}%)`);
  console.log(`ML Unavailable (Fallback): ${mlUnavailableCount} (${((mlUnavailableCount / results.length) * 100).toFixed(1)}%)`);

  if (mlAvailableCount > 0) {
    const withML = results.filter((r) => r.mlAvailable);
    const avgRuleBased = (
      withML.reduce((sum, r) => sum + parseFloat(r.ruleBasedScore), 0) /
      withML.length
    ).toFixed(3);
    const avgML = (
      withML.reduce((sum, r) => sum + parseFloat(r.mlScore), 0) /
      withML.length
    ).toFixed(3);
    const avgBlended = (
      withML.reduce((sum, r) => sum + parseFloat(r.blendedScore), 0) /
      withML.length
    ).toFixed(3);
    const avgDifference = (
      withML.reduce((sum, r) => sum + parseFloat(r.difference), 0) /
      withML.length
    ).toFixed(3);
    const avgPercentChange = (
      withML.reduce((sum, r) => sum + parseFloat(r.percentChange), 0) /
      withML.length
    ).toFixed(1);

    console.log(`\n📈 Average Scores (ML-available matches only):`);
    console.log(`  Rule-based: ${avgRuleBased}`);
    console.log(`  ML score: ${avgML}`);
    console.log(`  Blended: ${avgBlended}`);
    console.log(`  Average difference: ${avgDifference >= 0 ? '+' : ''}${avgDifference}`);
    console.log(`  Average % change: ${avgPercentChange >= 0 ? '+' : ''}${avgPercentChange}%`);

    // Count improvements
    const improved = withML.filter((r) => parseFloat(r.difference) > 0).length;
    const decreased = withML.filter((r) => parseFloat(r.difference) < 0).length;
    const same = withML.filter((r) => parseFloat(r.difference) === 0).length;

    console.log(`\n📊 Score Changes:`);
    console.log(`  Improved: ${improved} (${((improved / withML.length) * 100).toFixed(1)}%)`);
    console.log(`  Decreased: ${decreased} (${((decreased / withML.length) * 100).toFixed(1)}%)`);
    console.log(`  Same: ${same} (${((same / withML.length) * 100).toFixed(1)}%)`);
  }

  // Detailed results table
  console.log(`\n${'='.repeat(80)}`);
  console.log('📋 DETAILED RESULTS');
  console.log('='.repeat(80));
  console.log(
    '\nTest | User | Match | Rule-Based | ML Score | Blended | Diff | % Change'
  );
  console.log('-'.repeat(80));

  results.forEach((r, idx) => {
    console.log(
      `${String(idx + 1).padStart(4)} | ${r.user.padEnd(20)} | ${r.match.padEnd(20)} | ${r.ruleBasedScore.padStart(10)} | ${(r.mlScore !== 'N/A' ? r.mlScore : 'N/A').padStart(8)} | ${r.blendedScore.padStart(7)} | ${r.difference.padStart(4)} | ${r.percentChange.padStart(7)}%`
    );
  });

  console.log(`\n${'='.repeat(80)}`);
  console.log('✅ Testing Complete!');
  console.log('='.repeat(80));

  // Save results to file
  const fs = require('fs');
  const reportPath = 'ml-performance-report.json';
  fs.writeFileSync(
    reportPath,
    JSON.stringify(results, null, 2)
  );
  console.log(`\n💾 Detailed results saved to: ${reportPath}`);

  await redisClient?.quit();
}

// Run the test
testMLvsRuleBased().catch(console.error);
