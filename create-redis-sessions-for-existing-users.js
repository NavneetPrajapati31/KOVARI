#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const redis = require('redis');

console.log('🔴 Creating Redis Sessions for Existing Users\n');

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

function logUser(message) {
  log(`👤 ${message}`, 'cyan');
}

function logDb(message) {
  log(`🗄️  ${message}`, 'magenta');
}

function logRedis(message) {
  log(`🔴 ${message}`, 'red');
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  logError('Missing Supabase environment variables:');
  logError('  - NEXT_PUBLIC_SUPABASE_URL');
  logError('  - SUPABASE_SERVICE_ROLE_KEY');
  logError('\nPlease check your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get future date for travel sessions
function getFutureDate(daysFromNow) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Generate travel session data for each user
function generateTravelSession(user, profile, index) {
  const destinations = [
    { name: 'Goa', lat: 15.2993, lon: 74.1240 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
    { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
    { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
    { name: 'Pune', lat: 18.5204, lon: 73.8567 },
    { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
    { name: 'Varanasi', lat: 25.3176, lon: 82.9739 },
    { name: 'Agra', lat: 27.1767, lon: 78.0081 },
    { name: 'Srinagar', lat: 34.0837, lon: 74.7973 },
    { name: 'Shimla', lat: 31.1048, lon: 77.1734 },
    { name: 'Manali', lat: 32.2432, lon: 77.1892 },
    { name: 'Rishikesh', lat: 30.0869, lon: 78.2676 }
  ];
  
  const budgetRanges = [
    { min: 15000, max: 25000 },
    { min: 20000, max: 35000 },
    { min: 25000, max: 45000 },
    { min: 30000, max: 55000 },
    { min: 35000, max: 65000 },
    { min: 40000, max: 75000 }
  ];
  
  const tripDurations = [
    { start: 7, end: 10 },   // 3-4 days
    { start: 10, end: 14 },  // 4-5 days
    { start: 14, end: 21 },  // 7-8 days
    { start: 21, end: 28 },  // 7-10 days
    { start: 28, end: 35 }   // 7-10 days
  ];
  
  // Select destination (avoid user's home city)
  const availableDestinations = destinations.filter(d => d.name !== profile.location);
  const destination = availableDestinations[index % availableDestinations.length];
  
  // Select budget based on user's job and personality
  const budgetRange = budgetRanges[index % budgetRanges.length];
  const budget = Math.floor(Math.random() * (budgetRange.max - budgetRange.min + 1)) + budgetRange.min;
  
  // Select trip duration
  const duration = tripDurations[index % tripDurations.length];
  const startDate = getFutureDate(duration.start);
  const endDate = getFutureDate(duration.end);
  
  // Generate interests based on personality and job
  const interests = [];
  if (profile.personality === 'extrovert') {
    interests.push('nightlife', 'adventure', 'social_activities');
  } else if (profile.personality === 'introvert') {
    interests.push('cultural_sites', 'quiet_places', 'nature');
  } else {
    interests.push('balanced_activities', 'local_experiences', 'moderate_adventure');
  }
  
  // Add job-specific interests
  if (profile.job === 'software_engineer') interests.push('tech_meetups', 'coworking_spaces');
  if (profile.job === 'designer') interests.push('art_galleries', 'creative_spaces');
  if (profile.job === 'teacher') interests.push('educational_sites', 'museums');
  if (profile.job === 'yoga_instructor') interests.push('wellness_centers', 'spiritual_sites');
  if (profile.job === 'food_blogger') interests.push('local_cuisine', 'food_tours');
  
  return {
    userId: user.clerk_user_id,
    destination: destination,
    budget: budget,
    startDate: startDate,
    endDate: endDate,
    createdAt: new Date().toISOString(),
    mode: 'solo',
    interests: interests,
    // Static attributes from Supabase profile
    static_attributes: {
      name: profile.name,
      age: profile.age,
      gender: profile.gender,
      personality: profile.personality,
      location: profile.location,
      smoking: profile.smoking,
      drinking: profile.drinking,
      religion: profile.religion,
      job: profile.job,
      languages: profile.languages,
      nationality: profile.nationality,
      food_prefrence: profile.food_prefrence
    }
  };
}

// Create Redis sessions for existing users
async function createRedisSessionsForExistingUsers() {
  let redisClient;
  
  try {
    logInfo('Connecting to Supabase...');
    
    // Test Supabase connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      logError('Failed to connect to Supabase:');
      logError(testError.message);
      return;
    }
    
    logSuccess('Connected to Supabase successfully!');
    
    // Connect to Redis
    logInfo('Connecting to Redis...');
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6380'
    });
    
    await redisClient.connect();
    logSuccess('Connected to Redis successfully!');
    
    console.log('\n' + '='.repeat(80));
    logRedis('CREATING REDIS SESSIONS FOR EXISTING USERS');
    console.log('='.repeat(80));
    
    // Get all users with profiles from Supabase
    logInfo('Fetching users with profiles from Supabase...');
    
    // First, get all users
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, clerk_user_id');
    
    if (usersError) {
      logError('Failed to fetch users:');
      logError(usersError.message);
      return;
    }
    
    logInfo(`Found ${allUsers.length} total users`);
    
    // Then get all profiles
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select(`
        user_id,
        username,
        name,
        age,
        gender,
        personality,
        smoking,
        drinking,
        religion,
        job,
        languages,
        nationality,
        food_prefrence,
        location
      `);
    
    if (profilesError) {
      logError('Failed to fetch profiles:');
      logError(profilesError.message);
      return;
    }
    
    logInfo(`Found ${allProfiles.length} total profiles`);
    
    // Combine users with their profiles
    const validUsers = allUsers
      .map(user => {
        const profile = allProfiles.find(p => p.user_id === user.id);
        return profile ? { ...user, profiles: [profile] } : null;
      })
      .filter(user => user !== null);
    
    logInfo(`Found ${validUsers.length} users with profiles`);
    
    if (validUsers.length === 0) {
      logWarning('No users with profiles found. Please run create-profiles-for-existing-users first.');
      return;
    }
    
    // Clear existing Redis sessions
    logInfo('Clearing existing Redis sessions...');
    const existingKeys = await redisClient.keys('session:*');
    if (existingKeys.length > 0) {
      await redisClient.del(existingKeys);
      logSuccess(`Cleared ${existingKeys.length} existing sessions`);
    }
    
    // Create Redis sessions for each user
    logInfo('Creating Redis sessions...');
    
    for (let i = 0; i < validUsers.length; i++) {
      const user = validUsers[i];
      const profile = user.profiles[0]; // Get the first profile
      
      try {
        const sessionData = generateTravelSession(user, profile, i);
        const key = `session:${user.clerk_user_id}`;
        
        await redisClient.set(key, JSON.stringify(sessionData));
        
        logUser(`✅ Created session: ${profile.name} (@${profile.username})`);
        logRedis(`    🎯 Destination: ${sessionData.destination.name}`);
        logRedis(`    💰 Budget: ₹${sessionData.budget.toLocaleString()}`);
        logRedis(`    📅 Dates: ${sessionData.startDate} to ${sessionData.endDate}`);
        logRedis(`    🎭 ${profile.personality}, ${profile.age}yo ${profile.gender}`);
        logRedis(`    🍽️  ${profile.food_prefrence}, ${profile.smoking}, ${profile.drinking}`);
        
      } catch (error) {
        logError(`Failed to create session for ${profile.name}:`);
        logError(error.message);
      }
    }
    
    // Verify sessions were created
    logInfo('Verifying created sessions...');
    const createdKeys = await redisClient.keys('session:*');
    logSuccess(`Created ${createdKeys.length} Redis sessions`);
    
    // Show some sample sessions
    logInfo('Sample sessions created:');
    const sampleKeys = createdKeys.slice(0, 5);
    for (const key of sampleKeys) {
      const sessionData = JSON.parse(await redisClient.get(key));
      console.log(`  • ${key}: ${sessionData.destination.name} (₹${sessionData.budget.toLocaleString()})`);
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    logSuccess('REDIS SESSION CREATION COMPLETED');
    console.log('='.repeat(80));
    
    logInfo('Redis sessions created with the following structure:');
    logInfo('• Dynamic attributes: destination, budget, dates, interests');
    logInfo('• Static attributes: age, gender, personality, smoking, drinking');
    logInfo('• User identification: clerk_user_id');
    logInfo('• Session key format: session:{clerk_user_id}');
    
    console.log('\n📊 Summary:');
    console.log(`• Users with profiles: ${validUsers.length}`);
    console.log(`• Redis sessions created: ${createdKeys.length}`);
    console.log(`• Ready for algorithm testing!`);
    
    console.log('\n🎯 These sessions are now ready for matching algorithm testing!');
    console.log('💡 Run: npm run test-algorithm to test the full flow');
    
    // Show how the algorithm will work
    console.log('\n🔗 How Algorithm Testing Works:');
    console.log('================================');
    console.log('• Static attributes come from Supabase profiles');
    console.log('• Dynamic attributes come from Redis sessions');
    console.log('• Algorithm combines both for matching');
    console.log('• Tests destination, date overlap, budget compatibility');
    
  } catch (error) {
    logError('Failed to create Redis sessions:');
    logError(error.message);
    logError('Full error:');
    logError(JSON.stringify(error, null, 2));
  } finally {
    if (redisClient) {
      await redisClient.disconnect();
      logInfo('Disconnected from Redis');
    }
  }
}

// Run the script
if (require.main === module) {
  createRedisSessionsForExistingUsers().catch(error => {
    logError('Unexpected error:');
    logError(error.message);
    process.exit(1);
  });
}

module.exports = { createRedisSessionsForExistingUsers };
