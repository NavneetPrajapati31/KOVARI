#!/usr/bin/env node

/**
 * Generate Synthetic Match Events for ML Training Data
 * 
 * This script automatically generates ML match events by:
 * 1. Fetching all seed users and their Redis sessions
 * 2. Fetching user profiles from Supabase
 * 3. Pairing users and extracting compatibility features
 * 4. Generating realistic outcomes (accept/ignore) based on compatibility scores
 * 5. Writing events directly to JSONL format
 * 
 * This is MUCH faster than manual interactions and generates consistent data.
 * 
 * Usage:
 *   node src/lib/ai/datasets/generate-synthetic-match-events.js [options]
 * 
 * Options:
 *   --output <file>     Output file path (default: match_events_synthetic.jsonl)
 *   --count <number>    Number of events to generate (default: 300)
 *   --match-type <type> Match type: 'solo', 'group', or 'both' (default: 'both')
 *   --preset <preset>   Matching preset: 'balanced', 'strict', 'loose' (default: 'balanced')
 * 
 * Example:
 *   node src/lib/ai/datasets/generate-synthetic-match-events.js --count 500 --match-type solo
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const redis = require('redis');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REDIS_URL = process.env.REDIS_URL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

if (!REDIS_URL) {
  console.error('❌ Missing REDIS_URL in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

// Parse command line arguments
const args = process.argv.slice(2);
const getArg = (flag, defaultValue) => {
  const index = args.indexOf(flag);
  return index !== -1 && args[index + 1] ? args[index + 1] : defaultValue;
};

const outputFile = getArg('--output', 'match_events_synthetic.jsonl');
const eventCount = parseInt(getArg('--count', '300'), 10);
const matchType = getArg('--match-type', 'both'); // 'solo', 'group', or 'both'
const preset = getArg('--preset', 'balanced');

console.log('🚀 Starting Synthetic Match Event Generation\n');
console.log(`📊 Configuration:`);
console.log(`   Output file: ${outputFile}`);
console.log(`   Event count: ${eventCount}`);
console.log(`   Match type: ${matchType}`);
console.log(`   Preset: ${preset}\n`);

// Import feature extraction (we'll need to call it via a workaround)
// Since this is a Node.js script, we can't directly import TypeScript modules
// We'll need to replicate the logic or use a different approach

/**
 * Calculate compatibility score from features
 * This is a simplified version - in reality, the matching algorithm uses weighted scores
 */
function calculateCompatibilityScore(features) {
  if (!features) return 0;
  
  // Simple average of all feature scores
  const scores = [
    features.distanceScore || 0,
    features.dateOverlapScore || 0,
    features.budgetScore || 0,
    features.interestScore || 0,
    features.ageScore || 0,
    features.languageScore || 0,
    features.lifestyleScore || 0,
    features.backgroundScore || 0,
  ];
  
  const sum = scores.reduce((a, b) => a + b, 0);
  return sum / scores.length;
}

/**
 * Generate outcome based on compatibility score
 * Higher scores = more likely to accept
 */
function generateOutcome(compatibilityScore) {
  // Add some randomness but bias towards realistic outcomes
  const random = Math.random();
  
  if (compatibilityScore >= 0.7) {
    // High compatibility: 80% accept, 20% ignore
    return random < 0.8 ? 'accept' : 'ignore';
  } else if (compatibilityScore >= 0.5) {
    // Medium compatibility: 50% accept, 50% ignore
    return random < 0.5 ? 'accept' : 'ignore';
  } else if (compatibilityScore >= 0.3) {
    // Low compatibility: 20% accept, 80% ignore
    return random < 0.2 ? 'accept' : 'ignore';
  } else {
    // Very low compatibility: 5% accept, 95% ignore
    return random < 0.05 ? 'accept' : 'ignore';
  }
}

/**
 * Compute binary label from outcome
 */
function computeLabel(outcome) {
  return (outcome === 'accept' || outcome === 'chat') ? 1 : 0;
}

/**
 * Get user session from Redis
 */
async function getUserSession(redisClient, clerkUserId) {
  try {
    const sessionJSON = await redisClient.get(`session:${clerkUserId}`);
    if (!sessionJSON) return null;
    return JSON.parse(sessionJSON);
  } catch (error) {
    console.error(`Error fetching session for ${clerkUserId}:`, error.message);
    return null;
  }
}

/**
 * Get user profile from Supabase
 */
async function getUserProfile(clerkUserId) {
  try {
    // Get user UUID from Clerk ID
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
      .select('age, interests, personality, location, smoking, drinking, religion, nationality, job')
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

/**
 * Extract features for solo match (simplified version)
 * In production, this uses extractCompatibilityFeatures from the TypeScript module
 */
async function extractSoloMatchFeatures(userSession, targetSession, userProfile, targetProfile) {
  // This is a simplified feature extraction
  // In production, you'd call the actual extractCompatibilityFeatures function
  
  // For now, we'll generate realistic synthetic features based on session/profile data
  const features = {
    matchType: 'user_user',
    distanceScore: 1.0, // Assume same destination for now
    dateOverlapScore: calculateDateOverlap(userSession.startDate, userSession.endDate, targetSession.startDate, targetSession.endDate),
    budgetScore: calculateBudgetCompatibility(userSession.budget, targetSession.budget),
    interestScore: calculateInterestSimilarity(userProfile?.interests || [], targetProfile?.interests || []),
    ageScore: calculateAgeCompatibility(userProfile?.age, targetProfile?.age),
    languageScore: 0.8, // Assume some overlap
    lifestyleScore: calculateLifestyleCompatibility(userProfile, targetProfile),
    backgroundScore: calculateBackgroundCompatibility(userProfile, targetProfile),
  };
  
  return features;
}

/**
 * Calculate date overlap score (simplified)
 */
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

/**
 * Calculate budget compatibility
 */
function calculateBudgetCompatibility(budget1, budget2) {
  if (!budget1 || !budget2) return 0.5;
  const ratio = Math.min(budget1, budget2) / Math.max(budget1, budget2);
  return ratio;
}

/**
 * Calculate interest similarity (Jaccard)
 */
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

/**
 * Calculate age compatibility
 */
function calculateAgeCompatibility(age1, age2) {
  if (!age1 || !age2) return 0.5;
  const diff = Math.abs(age1 - age2);
  if (diff <= 2) return 1.0;
  if (diff <= 5) return 0.8;
  if (diff <= 10) return 0.6;
  if (diff <= 15) return 0.4;
  return 0.2;
}

/**
 * Calculate lifestyle compatibility
 */
function calculateLifestyleCompatibility(profile1, profile2) {
  if (!profile1 || !profile2) return 0.5;
  
  let score = 0.5;
  let factors = 0;
  
  if (profile1.smoking && profile2.smoking) {
    score += profile1.smoking === profile2.smoking ? 0.3 : -0.2;
    factors++;
  }
  
  if (profile1.drinking && profile2.drinking) {
    score += profile1.drinking === profile2.drinking ? 0.2 : -0.1;
    factors++;
  }
  
  return factors > 0 ? Math.max(0, Math.min(1, score)) : 0.5;
}

/**
 * Calculate background compatibility
 */
function calculateBackgroundCompatibility(profile1, profile2) {
  if (!profile1 || !profile2) return 0.5;
  
  let score = 0.5;
  
  if (profile1.nationality && profile2.nationality) {
    score += profile1.nationality === profile2.nationality ? 0.3 : 0;
  }
  
  if (profile1.religion && profile2.religion) {
    score += profile1.religion === profile2.religion ? 0.2 : 0;
  }
  
  return Math.min(1, score);
}

/**
 * Generate solo match events
 */
async function generateSoloMatchEvents(redisClient, users, count) {
  const events = [];
  const userPairs = [];
  
  // Generate all possible user pairs
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      userPairs.push([users[i], users[j]]);
      userPairs.push([users[j], users[i]]); // Both directions
    }
  }
  
  // Shuffle and take up to count
  const shuffled = userPairs.sort(() => Math.random() - 0.5);
  const selectedPairs = shuffled.slice(0, Math.min(count, shuffled.length));
  
  console.log(`📝 Generating ${selectedPairs.length} solo match events...`);
  
  for (const [user1, user2] of selectedPairs) {
    try {
      const session1 = await getUserSession(redisClient, user1.clerk_user_id);
      const session2 = await getUserSession(redisClient, user2.clerk_user_id);
      
      if (!session1 || !session2) {
        console.warn(`⚠️  Skipping pair: missing sessions`);
        continue;
      }
      
      const profile1 = await getUserProfile(user1.clerk_user_id);
      const profile2 = await getUserProfile(user2.clerk_user_id);
      
      if (!profile1 || !profile2) {
        console.warn(`⚠️  Skipping pair: missing profiles`);
        continue;
      }
      
      // Extract features
      const features = await extractSoloMatchFeatures(session1, session2, profile1, profile2);
      
      if (!features) {
        console.warn(`⚠️  Skipping pair: feature extraction failed`);
        continue;
      }
      
      // Calculate compatibility and generate outcome
      const compatibilityScore = calculateCompatibilityScore(features);
      const outcome = generateOutcome(compatibilityScore);
      const label = computeLabel(outcome);
      
      // Create event
      const event = {
        matchType: 'user_user',
        features: features,
        outcome: outcome,
        label: label,
        preset: preset,
        timestamp: Date.now() + Math.floor(Math.random() * 1000000), // Spread timestamps
        source: 'rule-based',
      };
      
      events.push(event);
      
      if (events.length % 10 === 0) {
        process.stdout.write(`\r   Generated ${events.length} events...`);
      }
    } catch (error) {
      console.error(`❌ Error generating event for pair:`, error.message);
    }
  }
  
  console.log(`\n✅ Generated ${events.length} solo match events`);
  return events;
}

/**
 * Generate group match events
 */
async function generateGroupMatchEvents(redisClient, users, groups, count) {
  const events = [];
  const userGroupPairs = [];
  
  // Generate all possible user-group pairs
  for (const user of users) {
    for (const group of groups) {
      userGroupPairs.push([user, group]);
    }
  }
  
  // Shuffle and take up to count
  const shuffled = userGroupPairs.sort(() => Math.random() - 0.5);
  const selectedPairs = shuffled.slice(0, Math.min(count, shuffled.length));
  
  console.log(`📝 Generating ${selectedPairs.length} group match events...`);
  
  for (const [user, group] of selectedPairs) {
    try {
      const session = await getUserSession(redisClient, user.clerk_user_id);
      
      if (!session) {
        console.warn(`⚠️  Skipping: missing session for user`);
        continue;
      }
      
      const profile = await getUserProfile(user.clerk_user_id);
      
      if (!profile) {
        console.warn(`⚠️  Skipping: missing profile for user`);
        continue;
      }
      
      // Extract features (simplified - would need actual group feature extraction)
      const features = {
        matchType: 'user_group',
        distanceScore: 1.0, // Assume compatible destination
        dateOverlapScore: calculateDateOverlap(session.startDate, session.endDate, group.start_date, group.end_date),
        budgetScore: calculateBudgetCompatibility(session.budget, group.budget),
        interestScore: calculateInterestSimilarity(profile?.interests || [], group.top_interests || []),
        ageScore: calculateAgeCompatibility(profile?.age, group.average_age),
        languageScore: 0.7, // Assume some overlap
        lifestyleScore: 0.6, // Simplified
        backgroundScore: 0.5, // Simplified
      };
      
      // Calculate compatibility and generate outcome
      const compatibilityScore = calculateCompatibilityScore(features);
      const outcome = generateOutcome(compatibilityScore);
      const label = computeLabel(outcome);
      
      // Create event
      const event = {
        matchType: 'user_group',
        features: features,
        outcome: outcome,
        label: label,
        preset: preset,
        timestamp: Date.now() + Math.floor(Math.random() * 1000000),
        source: 'rule-based',
      };
      
      events.push(event);
      
      if (events.length % 10 === 0) {
        process.stdout.write(`\r   Generated ${events.length} events...`);
      }
    } catch (error) {
      console.error(`❌ Error generating group event:`, error.message);
    }
  }
  
  console.log(`\n✅ Generated ${events.length} group match events`);
  return events;
}

/**
 * Main execution
 */
async function main() {
  let redisClient;
  
  try {
    // Connect to Redis
    console.log('🔌 Connecting to Redis...');
    redisClient = redis.createClient({ url: REDIS_URL });
    await redisClient.connect();
    console.log('✅ Connected to Redis\n');
    
    // Get all session keys
    console.log('📋 Fetching user sessions...');
    const sessionKeys = await redisClient.keys('session:*');
    console.log(`✅ Found ${sessionKeys.length} sessions\n`);
    
    if (sessionKeys.length === 0) {
      console.error('❌ No sessions found. Please create sessions first:');
      console.error('   node src/lib/ai/datasets/create-seed-user-sessions.js');
      process.exit(1);
    }
    
    // Get all sessions and extract user IDs
    const sessions = [];
    for (const key of sessionKeys) {
      const sessionJSON = await redisClient.get(key);
      if (sessionJSON) {
        const session = JSON.parse(sessionJSON);
        const clerkUserId = key.replace('session:', '');
        sessions.push({ ...session, clerk_user_id: clerkUserId });
      }
    }
    
    console.log(`📊 Found ${sessions.length} valid sessions\n`);
    
    // Get users from Supabase
    console.log('👤 Fetching user profiles...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, clerk_user_id')
      .in('clerk_user_id', sessions.map(s => s.clerk_user_id));
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      process.exit(1);
    }
    
    console.log(`✅ Found ${users.length} users\n`);
    
    // Generate events
    const allEvents = [];
    
    if (matchType === 'solo' || matchType === 'both') {
      const soloEvents = await generateSoloMatchEvents(redisClient, users, Math.floor(eventCount * 0.7));
      allEvents.push(...soloEvents);
    }
    
    if (matchType === 'group' || matchType === 'both') {
      // Get groups
      console.log('👥 Fetching groups...');
      const { data: groups, error: groupsError } = await supabase
        .from('groups')
        .select('id, destination, start_date, end_date, budget, average_age, top_interests, dominant_languages, members_count')
        .eq('status', 'active');
      
      if (groupsError) {
        console.error('❌ Error fetching groups:', groupsError);
      } else {
        console.log(`✅ Found ${groups.length} groups\n`);
        const groupEvents = await generateGroupMatchEvents(redisClient, users, groups || [], Math.floor(eventCount * 0.3));
        allEvents.push(...groupEvents);
      }
    }
    
    // Sort events by timestamp
    allEvents.sort((a, b) => a.timestamp - b.timestamp);
    
    // Write to file
    console.log(`\n💾 Writing ${allEvents.length} events to ${outputFile}...`);
    const outputPath = path.resolve(outputFile);
    const stream = fs.createWriteStream(outputPath, { encoding: 'utf8' });
    
    for (const event of allEvents) {
      stream.write(JSON.stringify(event) + '\n');
    }
    
    stream.end();
    
    console.log(`✅ Events written to ${outputPath}\n`);
    
    // Summary
    const soloCount = allEvents.filter(e => e.matchType === 'user_user').length;
    const groupCount = allEvents.filter(e => e.matchType === 'user_group').length;
    const acceptCount = allEvents.filter(e => e.outcome === 'accept').length;
    const ignoreCount = allEvents.filter(e => e.outcome === 'ignore').length;
    
    console.log('📊 Summary:');
    console.log(`   Total events: ${allEvents.length}`);
    console.log(`   Solo events: ${soloCount}`);
    console.log(`   Group events: ${groupCount}`);
    console.log(`   Accepts: ${acceptCount}`);
    console.log(`   Ignores: ${ignoreCount}`);
    console.log(`\n✅ Synthetic event generation complete!`);
    console.log(`\nNext steps:`);
    console.log(`   1. Review the generated events: Get-Content ${outputFile} | Select-Object -First 5`);
    console.log(`   2. Build training dataset: python src/lib/ai/datasets/build_training_set.py ${outputFile}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    if (redisClient) {
      await redisClient.quit();
    }
  }
}

main();
