/**
 * Debug ML Features - Diagnose why ML scores are identical
 * 
 * This script checks:
 * 1. What features are being extracted for different matches
 * 2. Whether static_attributes are populated
 * 3. Why features might be identical
 * 
 * Usage: node debug-ml-features.js <user_id>
 * Example: node debug-ml-features.js user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9
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

async function getUserProfileFromSupabase(clerkUserId) {
  try {
    // First, get the internal UUID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (userError || !userData) {
      return null;
    }

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('age, interests, personality, location')
      .eq('user_id', userData.id)
      .single();

    if (profileError || !profile) {
      return null;
    }

    return profile;
  } catch (error) {
    console.error(`Error fetching profile for ${clerkUserId}:`, error.message);
    return null;
  }
}

function calculateFeatures(userSession, matchSession) {
  // Simplified feature extraction (matching the actual logic)
  const NEUTRAL_SCORE = 0.5;

  // Distance score (simplified - assume same destination = 1.0)
  const distanceScore = 1.0;

  // Date overlap (simplified)
  const dateOverlapScore = 0.9; // Assume good overlap

  // Budget score
  const userBudget = userSession.budget || 0;
  const matchBudget = matchSession.budget || 0;
  const maxBudget = Math.max(userBudget, matchBudget);
  const budgetDiff = maxBudget > 0 ? Math.abs(userBudget - matchBudget) / maxBudget : 0;
  const budgetScore = budgetDiff <= 0.1 ? 1.0 : budgetDiff <= 0.25 ? 0.8 : budgetDiff <= 0.5 ? 0.6 : 0.4;

  // Interest score (Jaccard)
  const userInterests = userSession.static_attributes?.interests || [];
  const matchInterests = matchSession.static_attributes?.interests || [];
  let interestScore = NEUTRAL_SCORE;
  if (userInterests.length > 0 && matchInterests.length > 0) {
    const setA = new Set(userInterests);
    const setB = new Set(matchInterests);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    interestScore = union.size > 0 ? intersection.size / union.size : NEUTRAL_SCORE;
  }

  // Age score
  const userAge = userSession.static_attributes?.age;
  const matchAge = matchSession.static_attributes?.age;
  let ageScore = NEUTRAL_SCORE;
  if (userAge !== undefined && matchAge !== undefined) {
    const diff = Math.abs(userAge - matchAge);
    if (diff <= 2) ageScore = 1.0;
    else if (diff <= 5) ageScore = 0.9;
    else if (diff <= 10) ageScore = 0.7;
    else if (diff <= 15) ageScore = 0.5;
    else ageScore = 0.3;
  }

  // Personality score
  const userPersonality = userSession.static_attributes?.personality;
  const matchPersonality = matchSession.static_attributes?.personality;
  let personalityScore = NEUTRAL_SCORE;
  if (userPersonality && matchPersonality) {
    const map = {
      introvert: { introvert: 1.0, ambivert: 0.7, extrovert: 0.4 },
      ambivert: { introvert: 0.7, ambivert: 1.0, extrovert: 0.7 },
      extrovert: { introvert: 0.4, ambivert: 0.7, extrovert: 1.0 },
    };
    personalityScore = map[userPersonality]?.[matchPersonality] ?? NEUTRAL_SCORE;
  }

  return {
    distanceScore,
    dateOverlapScore,
    budgetScore,
    interestScore,
    ageScore,
    personalityScore,
  };
}

async function debugFeatures(userId) {
  console.log('🔍 Debugging ML Features\n');
  console.log('='.repeat(80));
  console.log(`Searching User: ${userId}`);
  console.log('='.repeat(80));

  const userSession = await getSession(userId);
  if (!userSession) {
    console.error(`❌ No session found for user: ${userId}`);
    process.exit(1);
  }

  console.log('\n📊 Searching User Session:');
  console.log(`   Destination: ${userSession.destination?.name || 'N/A'}`);
  console.log(`   Dates: ${userSession.startDate} to ${userSession.endDate}`);
  console.log(`   Budget: ₹${userSession.budget?.toLocaleString() || 'N/A'}`);
  console.log(`   Static Attributes:`, userSession.static_attributes || 'MISSING');

  // Check if static_attributes are in session
  if (!userSession.static_attributes) {
    console.log('\n⚠️  Searching user has NO static_attributes in session');
    console.log('   Fetching from Supabase...');
    const profile = await getUserProfileFromSupabase(userId);
    if (profile) {
      console.log(`   ✅ Found in Supabase: age=${profile.age}, interests=${profile.interests?.length || 0}, personality=${profile.personality || 'N/A'}`);
      userSession.static_attributes = {
        age: profile.age,
        interests: profile.interests,
        personality: profile.personality,
      };
    } else {
      console.log(`   ❌ NOT FOUND in Supabase either!`);
    }
  } else {
    console.log(`   ✅ Has static_attributes: age=${userSession.static_attributes.age || 'N/A'}, interests=${userSession.static_attributes.interests?.length || 0}, personality=${userSession.static_attributes.personality || 'N/A'}`);
  }

  // Get all other sessions
  const allSessions = await getAllSessions();
  const matchSessions = allSessions
    .filter(s => s.key !== `session:${userId}`)
    .slice(0, 5); // Check first 5 matches

  console.log(`\n📋 Found ${matchSessions.length} potential matches to analyze\n`);

  const featureResults = [];

  for (const matchData of matchSessions) {
    const matchUserId = matchData.key.replace('session:', '');
    const matchSession = matchData.session;

    console.log('='.repeat(80));
    console.log(`Match: ${matchUserId.substring(0, 30)}...`);
    console.log('='.repeat(80));

    console.log(`   Destination: ${matchSession.destination?.name || 'N/A'}`);
    console.log(`   Dates: ${matchSession.startDate} to ${matchSession.endDate}`);
    console.log(`   Budget: ₹${matchSession.budget?.toLocaleString() || 'N/A'}`);
    console.log(`   Static Attributes:`, matchSession.static_attributes || 'MISSING');

    // Check if static_attributes are in session
    if (!matchSession.static_attributes) {
      console.log('   ⚠️  Match has NO static_attributes in session');
      console.log('   Fetching from Supabase...');
      const profile = await getUserProfileFromSupabase(matchUserId);
      if (profile) {
        console.log(`   ✅ Found in Supabase: age=${profile.age}, interests=${profile.interests?.length || 0}, personality=${profile.personality || 'N/A'}`);
        matchSession.static_attributes = {
          age: profile.age,
          interests: profile.interests,
          personality: profile.personality,
        };
      } else {
        console.log(`   ❌ NOT FOUND in Supabase either!`);
        matchSession.static_attributes = {
          age: undefined,
          interests: [],
          personality: undefined,
        };
      }
    } else {
      console.log(`   ✅ Has static_attributes: age=${matchSession.static_attributes.age || 'N/A'}, interests=${matchSession.static_attributes.interests?.length || 0}, personality=${matchSession.static_attributes.personality || 'N/A'}`);
    }

    // Calculate features
    const features = calculateFeatures(userSession, matchSession);

    console.log('\n   📊 Extracted Features:');
    console.log(`      distanceScore: ${features.distanceScore.toFixed(3)}`);
    console.log(`      dateOverlapScore: ${features.dateOverlapScore.toFixed(3)}`);
    console.log(`      budgetScore: ${features.budgetScore.toFixed(3)}`);
    console.log(`      interestScore: ${features.interestScore.toFixed(3)} ${features.interestScore === 0.5 ? '⚠️ DEFAULT' : ''}`);
    console.log(`      ageScore: ${features.ageScore.toFixed(3)} ${features.ageScore === 0.5 ? '⚠️ DEFAULT' : ''}`);
    console.log(`      personalityScore: ${features.personalityScore.toFixed(3)} ${features.personalityScore === 0.5 ? '⚠️ DEFAULT' : ''}`);

    featureResults.push({
      matchUserId,
      features,
      hasStaticAttributes: !!matchSession.static_attributes,
      staticAttributes: matchSession.static_attributes,
    });
  }

  // Analyze results
  console.log('\n' + '='.repeat(80));
  console.log('📊 FEATURE ANALYSIS');
  console.log('='.repeat(80));

  // Check if all features are identical
  const allFeaturesIdentical = featureResults.every((r, i, arr) => {
    if (i === 0) return true;
    const prev = arr[i - 1].features;
    const curr = r.features;
    return (
      prev.distanceScore === curr.distanceScore &&
      prev.dateOverlapScore === curr.dateOverlapScore &&
      prev.budgetScore === curr.budgetScore &&
      prev.interestScore === curr.interestScore &&
      prev.ageScore === curr.ageScore &&
      prev.personalityScore === curr.personalityScore
    );
  });

  if (allFeaturesIdentical) {
    console.log('\n❌ PROBLEM FOUND: All features are IDENTICAL!');
    console.log('   This explains why ML scores are the same (0.485-0.486)');
    console.log('\n   Identical features:');
    const first = featureResults[0].features;
    console.log(`      distanceScore: ${first.distanceScore}`);
    console.log(`      dateOverlapScore: ${first.dateOverlapScore}`);
    console.log(`      budgetScore: ${first.budgetScore}`);
    console.log(`      interestScore: ${first.interestScore} ${first.interestScore === 0.5 ? '⚠️ DEFAULT' : ''}`);
    console.log(`      ageScore: ${first.ageScore} ${first.ageScore === 0.5 ? '⚠️ DEFAULT' : ''}`);
    console.log(`      personalityScore: ${first.personalityScore} ${first.personalityScore === 0.5 ? '⚠️ DEFAULT' : ''}`);
  } else {
    console.log('\n✅ Features are DIFFERENT between matches');
    console.log('   This is good - features should vary');
  }

  // Check for default values
  const defaultCounts = {
    interestScore: featureResults.filter(r => r.features.interestScore === 0.5).length,
    ageScore: featureResults.filter(r => r.features.ageScore === 0.5).length,
    personalityScore: featureResults.filter(r => r.features.personalityScore === 0.5).length,
  };

  console.log('\n📈 Default Value Analysis:');
  console.log(`   interestScore = 0.5 (default): ${defaultCounts.interestScore}/${featureResults.length} matches`);
  console.log(`   ageScore = 0.5 (default): ${defaultCounts.ageScore}/${featureResults.length} matches`);
  console.log(`   personalityScore = 0.5 (default): ${defaultCounts.personalityScore}/${featureResults.length} matches`);

  if (defaultCounts.interestScore === featureResults.length) {
    console.log('\n   ⚠️  ALL matches have default interestScore (0.5)');
    console.log('   → This means interests are missing or identical');
  }
  if (defaultCounts.ageScore === featureResults.length) {
    console.log('\n   ⚠️  ALL matches have default ageScore (0.5)');
    console.log('   → This means ages are missing or identical');
  }
  if (defaultCounts.personalityScore === featureResults.length) {
    console.log('\n   ⚠️  ALL matches have default personalityScore (0.5)');
    console.log('   → This means personalities are missing or identical');
  }

  // Check static_attributes availability
  const missingStaticAttributes = featureResults.filter(r => !r.hasStaticAttributes).length;
  console.log(`\n📋 Static Attributes Availability:`);
  console.log(`   Matches with static_attributes: ${featureResults.length - missingStaticAttributes}/${featureResults.length}`);
  console.log(`   Matches WITHOUT static_attributes: ${missingStaticAttributes}/${featureResults.length}`);

  if (missingStaticAttributes > 0) {
    console.log('\n   ⚠️  Some matches are missing static_attributes');
    console.log('   → This causes features to default to 0.5');
    console.log('   → Solution: Ensure users complete profile setup');
  }

  console.log('\n' + '='.repeat(80));
  console.log('💡 RECOMMENDATIONS');
  console.log('='.repeat(80));

  if (allFeaturesIdentical) {
    console.log('\n1. ❌ CRITICAL: Features are identical → ML scores will be identical');
    console.log('   Fix: Ensure static_attributes are populated for all users');
  }

  if (defaultCounts.interestScore === featureResults.length) {
    console.log('\n2. ⚠️  All interest scores are default (0.5)');
    console.log('   Fix: Ensure users have interests in their profiles');
  }

  if (defaultCounts.ageScore === featureResults.length) {
    console.log('\n3. ⚠️  All age scores are default (0.5)');
    console.log('   Fix: Ensure users have age in their profiles');
  }

  if (defaultCounts.personalityScore === featureResults.length) {
    console.log('\n4. ⚠️  All personality scores are default (0.5)');
    console.log('   Fix: Ensure users have personality in their profiles');
  }

  if (missingStaticAttributes > 0) {
    console.log('\n5. ⚠️  Some users are missing static_attributes');
    console.log('   Fix:');
    console.log('      - Complete user onboarding');
    console.log('      - Verify Supabase profiles are created');
    console.log('      - Check that static_attributes are fetched correctly');
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Debug complete!');
  console.log('='.repeat(80));

  await redisClient?.quit();
}

// Get user ID from command line
const userId = process.argv[2];

if (!userId) {
  console.error('❌ Error: User ID required');
  console.log('\nUsage: node debug-ml-features.js <user_id>');
  console.log('Example: node debug-ml-features.js user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9');
  process.exit(1);
}

debugFeatures(userId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
