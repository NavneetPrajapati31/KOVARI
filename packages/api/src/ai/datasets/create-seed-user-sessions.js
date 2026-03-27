#!/usr/bin/env node

/**
 * Create Redis Sessions for Seed Users
 * 
 * This script creates Redis sessions for all seed users so they can:
 * - See matches in the explore page
 * - Accept/ignore matches
 * - Send chat messages
 * - Generate ML training events
 * 
 * Usage:
 *   node src/lib/ai/datasets/create-seed-user-sessions.js
 * 
 * Requires:
 * - REDIS_URL in .env.local
 * - Seed users created in Clerk and database (synced with sync-seed-users-to-database.js)
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const redis = require('redis');

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

// Seed user emails (matching create-clerk-seed-users.js)
const seedUserEmails = [
  'budget.traveler@example.com',
  'luxury.traveler@example.com',
  'solo.introvert@example.com',
  'extrovert.group@example.com',
  'short.trip@example.com',
  'long.trip@example.com',
];

// Common destinations for seed users (ensures they can match with each other)
const destinations = [
  { name: 'Goa', lat: 15.2993, lon: 74.1240 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
  { name: 'Manali', lat: 32.2432, lon: 77.1892 },
  { name: 'Rishikesh', lat: 30.0869, lon: 78.2676 },
];

// Generate future dates (7-30 days from now)
function getFutureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Generate session data for seed user based on their profile
function generateSeedUserSession(user, profile, index) {
  // Assign destinations in round-robin to ensure overlap
  const destination = destinations[index % destinations.length];
  
  // Budget ranges based on user type
  let budget;
  if (profile.name && profile.name.toLowerCase().includes('budget')) {
    budget = 15000 + (index * 2000); // 15k-25k
  } else if (profile.name && profile.name.toLowerCase().includes('luxury')) {
    budget = 50000 + (index * 5000); // 50k-75k
  } else {
    budget = 25000 + (index * 3000); // 25k-40k
  }
  
  // Trip duration based on user type
  let startDays, endDays;
  if (profile.name && profile.name.toLowerCase().includes('short')) {
    startDays = 7;
    endDays = 10; // 3 days
  } else if (profile.name && profile.name.toLowerCase().includes('long')) {
    startDays = 14;
    endDays = 28; // 14 days
  } else {
    startDays = 10;
    endDays = 17; // 7 days
  }
  
  const startDate = getFutureDate(startDays);
  const endDate = getFutureDate(endDays);
  
  // Interests based on personality
  const interests = [];
  if (profile.personality === 'extrovert') {
    interests.push('nightlife', 'adventure', 'social_activities', 'group_travel');
  } else if (profile.personality === 'introvert') {
    interests.push('cultural_sites', 'quiet_places', 'nature', 'solo_travel');
  } else {
    interests.push('balanced_activities', 'local_experiences', 'moderate_adventure');
  }
  
  // Add interests from profile if available
  if (profile.interests && Array.isArray(profile.interests)) {
    interests.push(...profile.interests.slice(0, 3));
  }
  
  return {
    userId: user.clerk_user_id, // Use actual Clerk ID
    destination: destination,
    budget: budget,
    startDate: startDate,
    endDate: endDate,
    mode: 'solo',
    interests: [...new Set(interests)], // Remove duplicates
  };
}

async function createSeedUserSessions() {
  let redisClient;
  
  try {
    // Connect to Redis
    console.log('🔌 Connecting to Redis...');
    redisClient = redis.createClient({ url: REDIS_URL });
    await redisClient.connect();
    console.log('✅ Connected to Redis\n');
    
    // Get seed users from database
    // We'll identify seed users by checking profiles with seed-related usernames
    console.log('👤 Fetching seed users from database...');
    
    // Get all users
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, clerk_user_id');
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }
    
    if (!allUsers || allUsers.length === 0) {
      console.error('❌ No users found in database. Run sync-seed-users-to-database.js first.');
      return;
    }
    
    // Get all profiles
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, name, personality, interests');
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }
    
    // Filter to seed users - match by username patterns AND prefer actual Clerk IDs (user_*)
    const seedUserPatterns = [
      'budget_traveler',
      'luxury_traveler',
      'solo_introvert',
      'extrovert_group',
      'short_trip',
      'long_trip',
    ];
    
    // Find all candidate seed users
    const candidateSeedUsers = allUsers
      .map(user => {
        const profile = allProfiles?.find(p => p.user_id === user.id);
        if (!profile) return null;
        
        // Check if username matches seed patterns
        const isSeedUser = seedUserPatterns.some(pattern => 
          profile.username && profile.username.includes(pattern)
        );
        
        return isSeedUser ? { ...user, profile } : null;
      })
      .filter(user => user !== null);
    
    // Group by username pattern (to find duplicates)
    const usersByPattern = {};
    candidateSeedUsers.forEach(user => {
      const pattern = seedUserPatterns.find(p => 
        user.profile.username && user.profile.username.includes(p)
      );
      if (pattern) {
        if (!usersByPattern[pattern]) {
          usersByPattern[pattern] = [];
        }
        usersByPattern[pattern].push(user);
      }
    });
    
    // For each pattern, prefer user with actual Clerk ID (starts with 'user_')
    const seedUsers = [];
    seedUserPatterns.forEach(pattern => {
      const users = usersByPattern[pattern] || [];
      if (users.length > 0) {
        // Prefer user with actual Clerk ID (starts with 'user_')
        const actualUser = users.find(u => u.clerk_user_id.startsWith('user_'));
        if (actualUser) {
          seedUsers.push(actualUser);
        } else {
          // Fallback to first user (placeholder ID)
          seedUsers.push(users[0]);
        }
      }
    });
    
    if (seedUsers.length === 0) {
      console.error('❌ No seed users found. Make sure seed users are synced to database.');
      return;
    }
    
    console.log(`✅ Found ${seedUsers.length} seed users\n`);
    
    // Create Redis sessions
    console.log('📝 Creating Redis sessions for seed users...\n');
    const ttlSeconds = 7 * 24 * 60 * 60; // 7 days
    
    let successCount = 0;
    for (let i = 0; i < seedUsers.length; i++) {
      const user = seedUsers[i];
      try {
        const sessionData = generateSeedUserSession(user, user.profile, i);
        const key = `session:${user.clerk_user_id}`; // Use actual Clerk ID
        
        // Check if session already exists
        const existing = await redisClient.get(key);
        if (existing) {
          console.log(`ℹ️  Session already exists: ${user.clerk_user_id}`);
          console.log(`   Updating session...`);
        }
        
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(sessionData));
        
        console.log(`✅ Created session: ${user.clerk_user_id}`);
        console.log(`   📝 Profile: ${user.profile.name || user.profile.username}`);
        console.log(`   🎯 Destination: ${sessionData.destination.name}`);
        console.log(`   💰 Budget: ₹${sessionData.budget.toLocaleString()}`);
        console.log(`   📅 Dates: ${sessionData.startDate} to ${sessionData.endDate}`);
        console.log(`   🎭 Interests: ${sessionData.interests.slice(0, 4).join(', ')}`);
        console.log('');
        
        successCount++;
      } catch (error) {
        console.error(`❌ Error creating session for ${user.clerk_user_id}:`, error.message);
      }
    }
    
    console.log(`\n✅ Created ${successCount}/${seedUsers.length} Redis sessions\n`);
    
    // Verify sessions
    console.log('🔍 Verifying created sessions...');
    
    // Count sessions for seed users (using their actual Clerk IDs)
    const seedUserClerkIds = seedUsers.map(u => u.clerk_user_id);
    let sessionCount = 0;
    for (const clerkId of seedUserClerkIds) {
      const session = await redisClient.get(`session:${clerkId}`);
      if (session) sessionCount++;
    }
    
    console.log(`✅ Found ${sessionCount}/${seedUsers.length} seed user sessions in Redis\n`);
    
    // Show summary
    console.log('='.repeat(60));
    console.log('📊 SESSION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total seed users: ${seedUsers.length}`);
    console.log(`Sessions created: ${successCount}`);
    console.log(`Sessions verified: ${sessionCount}`);
    console.log(`Destinations used: ${destinations.map(d => d.name).join(', ')}`);
    console.log('\n💡 Seed users can now:');
    console.log('   - See matches in explore page');
    console.log('   - Accept/ignore matches');
    console.log('   - Send chat messages');
    console.log('   - Generate ML training events');
    console.log('\n🚀 Ready for data collection!');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    if (redisClient) {
      await redisClient.quit();
      console.log('\n🔌 Disconnected from Redis');
    }
  }
}

// Run the script
createSeedUserSessions().catch(console.error);
