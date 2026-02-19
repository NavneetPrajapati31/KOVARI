#!/usr/bin/env node

/**
 * Sync Seed Users to Database
 * 
 * This script creates database records for seed users that were created in Clerk.
 * It matches Clerk users by email address and creates corresponding database records.
 * 
 * Usage:
 *   node src/lib/ai/datasets/sync-seed-users-to-database.js
 * 
 * Requires:
 * - CLERK_SECRET_KEY in .env.local
 * - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

require('dotenv').config({ path: '.env.local' });
const { createClerkClient } = require('@clerk/clerk-sdk-node');
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const clerkSecretKey = process.env.CLERK_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!clerkSecretKey || !supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables in .env.local');
  process.exit(1);
}

const clerk = createClerkClient({ secretKey: clerkSecretKey });
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Seed user emails (matching create-clerk-seed-users.js)
const seedUserEmails = [
  'budget.traveler@example.com',
  'luxury.traveler@example.com',
  'solo.introvert@example.com',
  'extrovert.group@example.com',
  'short.trip@example.com',
  'long.trip@example.com',
];

// Profile data mapping (based on seed-training-data.js structure)
const profileDataMap = {
  'budget.traveler@example.com': {
    username: 'budget_traveler_001',
    name: 'Budget Traveler',
    age: 28,
    gender: 'Male',
    personality: 'ambivert',
    smoking: 'No',
    drinking: 'No',
    religion: 'hindu',
    food_preference: 'veg',
    nationality: 'Indian',
    job: 'student',
    languages: ['english', 'hindi'],
    location: 'Mumbai',
    bio: 'Budget-conscious traveler looking for affordable adventures',
    interests: ['budget travel', 'backpacking', 'hostels', 'street food'],
  },
  'luxury.traveler@example.com': {
    username: 'luxury_traveler_002',
    name: 'Luxury Traveler',
    age: 35,
    gender: 'Female',
    personality: 'extrovert',
    smoking: 'No',
    drinking: 'Yes',
    religion: 'hindu',
    food_preference: 'non_veg',
    nationality: 'Indian',
    job: 'executive',
    languages: ['english', 'hindi'],
    location: 'Delhi',
    bio: 'Luxury travel enthusiast seeking premium experiences',
    interests: ['luxury travel', 'fine dining', 'spas', 'premium hotels'],
  },
  'solo.introvert@example.com': {
    username: 'solo_introvert_003',
    name: 'Solo Introvert',
    age: 26,
    gender: 'Female',
    personality: 'introvert',
    smoking: 'No',
    drinking: 'No',
    religion: 'hindu',
    food_preference: 'veg',
    nationality: 'Indian',
    job: 'writer',
    languages: ['english', 'hindi'],
    location: 'Bangalore',
    bio: 'Solo traveler who prefers quiet exploration and meaningful connections',
    interests: ['solo travel', 'museums', 'reading', 'photography'],
  },
  'extrovert.group@example.com': {
    username: 'extrovert_group_004',
    name: 'Extrovert Group-Friendly',
    age: 30,
    gender: 'Male',
    personality: 'extrovert',
    smoking: 'No',
    drinking: 'Yes',
    religion: 'hindu',
    food_preference: 'non_veg',
    nationality: 'Indian',
    job: 'marketing',
    languages: ['english', 'hindi'],
    location: 'Chennai',
    bio: 'Love group travel and meeting new people! Always up for adventures',
    interests: ['group travel', 'nightlife', 'adventure sports', 'social events'],
  },
  'short.trip@example.com': {
    username: 'short_trip_005',
    name: 'Short Trip Traveler',
    age: 25,
    gender: 'Female',
    personality: 'ambivert',
    smoking: 'No',
    drinking: 'Yes',
    religion: 'hindu',
    food_preference: 'veg',
    nationality: 'Indian',
    job: 'designer',
    languages: ['english', 'hindi'],
    location: 'Pune',
    bio: 'Weekend warrior - love short getaways and quick adventures',
    interests: ['weekend trips', 'city breaks', 'quick adventures'],
  },
  'long.trip@example.com': {
    username: 'long_trip_006',
    name: 'Long Trip Traveler',
    age: 32,
    gender: 'Male',
    personality: 'ambivert',
    smoking: 'No',
    drinking: 'Yes',
    religion: 'hindu',
    food_preference: 'non_veg',
    nationality: 'Indian',
    job: 'engineer',
    languages: ['english', 'hindi'],
    location: 'Hyderabad',
    bio: 'Love extended travel experiences and deep cultural immersion',
    interests: ['long trips', 'cultural immersion', 'local experiences'],
  },
};

function calculateBirthday(age) {
  const currentYear = new Date().getFullYear();
  const birthYear = currentYear - age;
  return `${birthYear}-01-01`;
}

async function syncSeedUser(email) {
  try {
    // Get Clerk user by email
    const clerkUsers = await clerk.users.getUserList({
      emailAddress: [email],
    });

    if (!clerkUsers || clerkUsers.length === 0) {
      console.error(`❌ Clerk user not found: ${email}`);
      return null;
    }

    const clerkUser = clerkUsers[0];
    const clerkUserId = clerkUser.id;

    console.log(`\n📧 Processing: ${email}`);
    console.log(`   Clerk ID: ${clerkUserId}`);

    // Check if user already exists in database
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle();

    let userId;
    if (existingUser) {
      userId = existingUser.id;
      console.log(`   ✅ User already exists in DB: ${userId}`);
    } else {
      // Create user in database
      userId = uuidv4();
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          clerk_user_id: clerkUserId,
          created_at: new Date().toISOString(),
        });

      if (userError) {
        console.error(`   ❌ Error creating user: ${userError.message}`);
        return null;
      }
      console.log(`   ✅ Created user in DB: ${userId}`);
    }

    // Get profile data
    const profileData = profileDataMap[email];
    if (!profileData) {
      console.warn(`   ⚠️  No profile data found for ${email}`);
      return { userId, clerkUserId };
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('user_id', userId)
      .maybeSingle();

    const birthday = calculateBirthday(profileData.age);

    if (existingProfile) {
      // Profile already exists - check if location is set (required for session creation)
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('location, name')
        .eq('user_id', userId)
        .single();
      
      if (!currentProfile?.location) {
        // Update profile with location if missing
        const locationValue = profileData.location || 'Bangalore';
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            location: locationValue,
          })
          .eq('user_id', userId);
        
        if (updateError) {
          console.error(`   ⚠️  Error updating profile location: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated profile location: ${locationValue}`);
        }
      } else {
        console.log(`   ✅ Profile already exists: ${currentProfile.name || existingProfile.username || 'N/A'} (location: ${currentProfile.location || 'N/A'})`);
      }
    } else {
      // Create new profile - check if profile exists with different username first
      const { data: existingByUsername } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('username', profileData.username)
        .maybeSingle();
      
      if (existingByUsername) {
        // Profile exists with same username but different user_id - update it
        console.log(`   ⚠️  Profile with username ${profileData.username} exists for different user, updating...`);
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            user_id: userId,
            location: profileData.location || 'Bangalore',
            ...profileData,
            birthday,
          })
          .eq('id', existingByUsername.id);
        
        if (updateError) {
          console.error(`   ❌ Error updating existing profile: ${updateError.message}`);
          return { userId, clerkUserId };
        }
        console.log(`   ✅ Updated existing profile: ${profileData.name}`);
      } else {
        // Create new profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            ...profileData,
            birthday,
            verified: true,
            deleted: false,
            created_at: new Date().toISOString(),
          });

        if (profileError) {
          console.error(`   ❌ Error creating profile: ${profileError.message}`);
          // Try to find and update existing profile
          const { data: existingByUser } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (existingByUser) {
            console.log(`   ℹ️  Profile exists for this user, updating location...`);
            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                location: profileData.location || 'Bangalore',
              })
              .eq('user_id', userId);
            
            if (updateError) {
              console.error(`   ❌ Error updating location: ${updateError.message}`);
            } else {
              console.log(`   ✅ Updated profile location: ${profileData.location || 'Bangalore'}`);
            }
          }
          return { userId, clerkUserId };
        }
        console.log(`   ✅ Created profile: ${profileData.name}`);
      }
    }

    return { userId, clerkUserId };
  } catch (error) {
    console.error(`❌ Error syncing ${email}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🔄 Syncing seed users from Clerk to database...\n');

  const syncedUsers = [];
  for (const email of seedUserEmails) {
    const result = await syncSeedUser(email);
    if (result) {
      syncedUsers.push({ email, ...result });
    }
  }

  console.log(`\n✅ Synced ${syncedUsers.length}/${seedUserEmails.length} seed users\n`);

  console.log('='.repeat(60));
  console.log('📊 SYNC SUMMARY');
  console.log('='.repeat(60));
  console.log(`Users synced: ${syncedUsers.length}`);
  console.log('\n💡 Next steps:');
  console.log('1. Run: node src/lib/ai/datasets/create-seed-user-sessions.js');
  console.log('2. Login as seed users and start generating interactions');
}

main().catch(console.error);

