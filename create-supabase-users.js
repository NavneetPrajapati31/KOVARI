#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🗄️ Creating Supabase Users & Profiles for KOVARI Algorithm Testing\n');

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

// Test users with static attributes (to be stored in Supabase)
const testUsers = [
  {
    // User 1: Alice - Extrovert Software Engineer
    clerk_user_id: 'clerk_alice_123',
    username: 'alice_sharma',
    name: 'Alice Sharma',
    age: 28,
    gender: 'female',
    personality: 'extrovert',
    smoking: 'No',
    drinking: 'Socially',
    religion: 'hindu',
    food_prefrence: 'veg',
    nationality: 'indian',
    job: 'software_engineer',
    languages: ['english', 'hindi'],
    location: 'Mumbai',
    profile_photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Passionate software engineer who loves to travel and capture moments through photography. Always excited to meet new people and explore new cultures!',
    number: '+919876543210',
    email: 'alice@test.com',
    birthday: '1997-03-15',
    verified: true
  },
  {
    // User 2: Bob - Ambivert Designer
    clerk_user_id: 'clerk_bob_456',
    username: 'bob_kumar',
    name: 'Bob Kumar',
    age: 30,
    gender: 'male',
    personality: 'ambivert',
    smoking: 'No',
    drinking: 'Socially',
    religion: 'hindu',
    food_prefrence: 'non_veg',
    nationality: 'indian',
    job: 'designer',
    languages: ['english', 'hindi'],
    location: 'Delhi',
    profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Creative designer with a love for adventure and cultural experiences. I enjoy both quiet moments and exciting adventures while traveling.',
    number: '+919876543211',
    email: 'bob@test.com',
    birthday: '1995-07-22',
    verified: true
  },
  {
    // User 3: Carol - Introvert Teacher
    clerk_user_id: 'clerk_carol_789',
    username: 'carol_fernandes',
    name: 'Carol Fernandes',
    age: 26,
    gender: 'female',
    personality: 'introvert',
    smoking: 'No',
    drinking: 'No',
    religion: 'christian',
    food_prefrence: 'veg',
    nationality: 'indian',
    job: 'teacher',
    languages: ['english', 'hindi', 'konkani'],
    location: 'Bangalore',
    profile_photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Art teacher who finds peace in museums and quiet places. I love exploring art and culture while traveling, and prefer meaningful conversations over large groups.',
    number: '+919876543212',
    email: 'carol@test.com',
    birthday: '1999-11-08',
    verified: true
  },
  {
    // User 4: David - Extrovert Marketing Manager
    clerk_user_id: 'clerk_david_101',
    username: 'david_patel',
    name: 'David Patel',
    age: 32,
    gender: 'male',
    personality: 'extrovert',
    smoking: 'No',
    drinking: 'Socially',
    religion: 'hindu',
    food_prefrence: 'non_veg',
    nationality: 'indian',
    job: 'marketing_manager',
    languages: ['english', 'hindi', 'gujarati'],
    location: 'Chennai',
    profile_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Marketing professional who loves the energy of nightlife, live music, and trying new cuisines. Always up for meeting new people and having fun while traveling!',
    number: '+919876543213',
    email: 'david@test.com',
    birthday: '1993-05-14',
    verified: true
  },
  {
    // User 5: Emma - Ambivert Yoga Instructor
    clerk_user_id: 'clerk_emma_202',
    username: 'emma_singh',
    name: 'Emma Singh',
    age: 31,
    gender: 'female',
    personality: 'ambivert',
    smoking: 'No',
    drinking: 'Socially',
    religion: 'sikh',
    food_prefrence: 'veg',
    nationality: 'indian',
    job: 'yoga_instructor',
    languages: ['english', 'hindi', 'punjabi'],
    location: 'Goa',
    profile_photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
    bio: 'Yoga instructor passionate about wellness and beach life. I love connecting with people who share my interest in health and spirituality while traveling.',
    number: '+919876543214',
    email: 'emma@test.com',
    birthday: '1994-09-30',
    verified: true
  },
  {
    // User 6: Frank - Introvert Musician
    clerk_user_id: 'clerk_frank_303',
    username: 'frank_iyer',
    name: 'Frank Iyer',
    age: 26,
    gender: 'male',
    personality: 'introvert',
    smoking: 'No',
    drinking: 'No',
    religion: 'hindu',
    food_prefrence: 'veg',
    nationality: 'indian',
    job: 'musician',
    languages: ['english', 'hindi', 'tamil'],
    location: 'Hyderabad',
    profile_photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Classical musician who finds inspiration in cultural sites and temples. I prefer quiet exploration and deep cultural immersion while traveling.',
    number: '+919876543215',
    email: 'frank@test.com',
    birthday: '1999-01-25',
    verified: true
  },
  {
    // User 7: Grace - Extrovert Food Blogger
    clerk_user_id: 'clerk_grace_404',
    username: 'grace_khan',
    name: 'Grace Khan',
    age: 29,
    gender: 'female',
    personality: 'extrovert',
    smoking: 'No',
    drinking: 'Socially',
    religion: 'muslim',
    food_prefrence: 'non_veg',
    nationality: 'indian',
    job: 'food_blogger',
    languages: ['english', 'hindi', 'urdu'],
    location: 'Kolkata',
    profile_photo: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Food blogger who loves exploring culinary traditions and historical sites. Always excited to meet fellow food lovers and share dining experiences!',
    number: '+919876543216',
    email: 'grace@test.com',
    birthday: '1996-12-03',
    verified: true
  },
  {
    // User 8: Henry - Ambivert Writer
    clerk_user_id: 'clerk_henry_505',
    username: 'henry_das',
    name: 'Henry Das',
    age: 27,
    gender: 'male',
    personality: 'ambivert',
    smoking: 'No',
    drinking: 'Socially',
    religion: 'hindu',
    food_prefrence: 'veg',
    nationality: 'indian',
    job: 'writer',
    languages: ['english', 'hindi', 'bengali'],
    location: 'Pune',
    profile_photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Writer who finds stories in every culture and cuisine. I enjoy both quiet writing sessions and engaging conversations with locals while traveling.',
    number: '+919876543217',
    email: 'henry@test.com',
    birthday: '1998-06-18',
    verified: true
  }
];

// Create users and profiles in Supabase
async function createSupabaseUsers() {
  try {
    logInfo('Connecting to Supabase...');
    
    // Test connection to users table
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      logError('Failed to connect to Supabase users table:');
      logError(testError.message);
      return;
    }
    
    logSuccess('Connected to Supabase successfully!');
    
    console.log('\n' + '='.repeat(80));
    logDb('CREATING SUPABASE USERS & PROFILES');
    console.log('='.repeat(80));
    
    // Clear existing test users and profiles
    logInfo('Clearing existing test data...');
    
    // First, get all existing test users to get their IDs
    const { data: existingUsers, error: fetchUsersError } = await supabase
      .from('users')
      .select('id')
      .in('clerk_user_id', testUsers.map(u => u.clerk_user_id));
    
    if (fetchUsersError) {
      logWarning('Could not fetch existing users for cleanup:');
      logWarning(fetchUsersError.message);
    } else if (existingUsers && existingUsers.length > 0) {
      // Clear profiles by user_id (more reliable than username)
      const existingUserIds = existingUsers.map(u => u.id);
      const { error: deleteProfilesError } = await supabase
        .from('profiles')
        .delete()
        .in('user_id', existingUserIds);
      
      if (deleteProfilesError) {
        logWarning('Could not clear existing profiles:');
        logWarning(deleteProfilesError.message);
      } else {
        logSuccess(`Cleared ${existingUsers.length} existing test profiles`);
      }
    }
    
    // Also check for any profiles that might conflict with our new UUIDs
    logInfo('Checking for potential profile conflicts...');
    const { data: conflictingProfiles, error: conflictError } = await supabase
      .from('profiles')
      .select('user_id, username')
      .limit(20);
    
    if (conflictError) {
      logWarning('Could not check for conflicting profiles:');
      logWarning(conflictError.message);
    } else if (conflictingProfiles && conflictingProfiles.length > 0) {
      logWarning(`Found ${conflictingProfiles.length} existing profiles that might conflict:`);
      conflictingProfiles.forEach(profile => {
        logWarning(`  - user_id: ${profile.user_id}, username: ${profile.username}`);
      });
      
      // Try to clear these conflicting profiles
      const conflictingUserIds = conflictingProfiles.map(p => p.user_id).filter(id => id !== null);
      if (conflictingUserIds.length > 0) {
        logInfo('Attempting to clear conflicting profiles...');
        const { error: clearConflictError } = await supabase
          .from('profiles')
          .delete()
          .in('user_id', conflictingUserIds);
        
        if (clearConflictError) {
          logWarning('Could not clear conflicting profiles:');
          logWarning(clearConflictError.message);
        } else {
          logSuccess(`Cleared ${conflictingUserIds.length} conflicting profiles`);
        }
      }
    }
    
    // Then clear all test users
    logInfo('Clearing test users...');
    const { error: deleteUsersError } = await supabase
      .from('users')
      .delete()
      .in('clerk_user_id', testUsers.map(u => u.clerk_user_id));
    
    if (deleteUsersError) {
      logWarning('Could not clear existing users (might not exist):');
      logWarning(deleteUsersError.message);
    } else {
      logSuccess('Cleared existing test users');
    }
    
    // Verify cleanup
    logInfo('Verifying cleanup...');
    const { data: remainingProfiles, error: checkProfilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (checkProfilesError) {
      logWarning('Could not check remaining profiles:');
      logWarning(checkProfilesError.message);
    } else {
      logSuccess('Cleanup verification completed');
    }
    
    // Insert new users and profiles
    logInfo('Creating users and profiles...');
    
    for (const user of testUsers) {
      try {
        // Step 1: Insert into users table
        logInfo(`Creating user: ${user.name} (${user.clerk_user_id})`);
        const { data: userData, error: userError } = await supabase
          .from('users')
          .insert({
            clerk_user_id: user.clerk_user_id
          })
          .select()
          .single();
        
        if (userError) {
          logError(`Failed to create user ${user.name}:`);
          logError(userError.message);
          continue;
        }
        
        logUser(`✅ Created user: ${user.name} (ID: ${userData.id})`);
        
        // Step 2: Insert into profiles table using the user_id from users table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userData.id, // Foreign key reference to users.id
            username: user.username,
            name: user.name,
            age: user.age,
            gender: user.gender,
            personality: user.personality,
            smoking: user.smoking,
            drinking: user.drinking,
            religion: user.religion,
            food_prefrence: user.food_prefrence,
            nationality: user.nationality,
            job: user.job,
            languages: user.languages,
            location: user.location,
            profile_photo: user.profile_photo,
            bio: user.bio,
            number: user.number,
            email: user.email,
            birthday: user.birthday,
            verified: user.verified
          })
          .select()
          .single();
        
        if (profileError) {
          logError(`Failed to create profile for ${user.name}:`);
          logError(profileError.message);
          continue;
        }
        
        logDb(`  ✅ Profile created for ${user.name}`);
        logDb(`    📍 Location: ${user.location}`);
        logDb(`    💼 Job: ${user.job}`);
        logDb(`    🎭 Personality: ${user.personality}`);
        logDb(`    🍽️  Food: ${user.food_prefrence}, Smoking: ${user.smoking}, Drinking: ${user.drinking}`);
        
      } catch (error) {
        logError(`Unexpected error creating user ${user.name}:`);
        logError(error.message);
      }
    }
    
    // Final summary
    console.log('\n' + '='.repeat(80));
    logSuccess('SUPABASE USER & PROFILE CREATION COMPLETED');
    console.log('='.repeat(80));
    
    logInfo('Created users with the following structure:');
    logInfo('• users table: clerk_user_id, id (UUID)');
    logInfo('• profiles table: user_id (FK to users.id), detailed attributes');
    logInfo('• Foreign key relationship maintained');
    
    console.log('\n📊 User Summary:');
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (@${user.username})`);
      console.log(`   👤 ${user.age}yo ${user.gender}, ${user.personality}`);
      console.log(`   🏠 ${user.location}`);
      console.log(`   💼 ${user.job}`);
      console.log(`   🎯 ${user.languages.join(', ')}`);
      console.log(`   🍽️  ${user.food_prefrence}, ${user.smoking}, ${user.drinking}`);
      console.log(`   🔑 Clerk ID: ${user.clerk_user_id}`);
      console.log('');
    });
    
    console.log('🎯 These users are now ready for Redis session testing!');
    console.log('💡 Run: npm run test-algorithm to test the full flow');
    
    // Show how to use these users in Redis sessions
    console.log('\n🔗 How to Use in Redis Sessions:');
    console.log('================================');
    console.log('• Static attributes come from Supabase profiles table');
    console.log('• Dynamic attributes (destination, dates, budget) go in Redis');
    console.log('• Algorithm combines both for matching');
    console.log('');
    console.log('Example Redis session structure:');
    console.log('  {');
    console.log('    userId: "clerk_user_id",');
    console.log('    destination: { name: "Goa", lat: 15.2993, lon: 74.1240 },');
    console.log('    budget: 25000,');
    console.log('    startDate: "2025-09-28",');
    console.log('    endDate: "2025-10-03",');
    console.log('    static_attributes: { /* from Supabase profiles */ }');
    console.log('  }');
    
  } catch (error) {
    logError('Failed to create Supabase users:');
    logError(error.message);
    logError('Full error:');
    logError(JSON.stringify(error, null, 2));
  }
}

// Run the script
if (require.main === module) {
  createSupabaseUsers().catch(error => {
    logError('Unexpected error:');
    logError(error.message);
    process.exit(1);
  });
}

module.exports = { createSupabaseUsers, testUsers };
