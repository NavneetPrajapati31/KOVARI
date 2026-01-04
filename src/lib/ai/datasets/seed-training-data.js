#!/usr/bin/env node

/**
 * Seed Training Data Script (Day 2 - Phase 4)
 * 
 * Creates seed users and groups for ML training data collection.
 * These are fixed profiles covering different user segments as per
 * DATA_COLLECTION_GUIDE.md requirements.
 * 
 * Usage:
 *   node src/lib/ai/datasets/seed-training-data.js
 * 
 * The script creates:
 * - 6 seed users with profiles, travel preferences, and travel modes
 * - 4 seed groups with various characteristics
 * 
 * All data matches the exact database schemas for:
 * - profiles table
 * - groups table
 * - travel_preferences table
 * - travel_modes table
 * 
 * See SEED_DATA_README.md for detailed documentation.
 */

// Try to load environment variables from .env.local or .env
const fs = require('fs');
const envLocalPath = '.env.local';
const envPath = '.env';

if (fs.existsSync(envLocalPath)) {
  require('dotenv').config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
} else {
  console.warn('⚠️  Warning: No .env.local or .env file found. Using system environment variables.');
}

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// ============================================================================
// SCHEMA DOCUMENTATION
// ============================================================================
/*
 * PROFILES TABLE:
 * - Required fields: username, location, religion, smoking, drinking, 
 *   personality, food_preference, interests, deleted
 * - Optional: name, age, gender, nationality, bio, languages, profile_photo,
 *   job, verified, birthday, number, email
 * - Foreign key: user_id -> users.id
 * 
 * GROUPS TABLE:
 * - Required fields: name, budget, members_count, status, flag_count
 * - Optional: creator_id, is_public, destination, start_date, end_date,
 *   description, cover_image, notes, dominant_languages, top_interests,
 *   non_smokers, non_drinkers, average_age, destination_lat, destination_lon
 * - Foreign key: creator_id -> users.id
 * 
 * TRAVEL_PREFERENCES TABLE:
 * - Optional: user_id, destinations, trip_focus, frequency
 * - Foreign key: user_id -> users.id
 * 
 * TRAVEL_MODES TABLE:
 * - Optional: user_id, mode ('solo' | 'group')
 * - Foreign key: user_id -> users.id
 */

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 To fix this:');
  console.error('   1. Create a .env.local file in the project root with:');
  console.error('      NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.error('      SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  console.error('\n   2. Or set them as environment variables in your system');
  console.error('\n   3. Or pass them inline:');
  console.error('      $env:NEXT_PUBLIC_SUPABASE_URL="url"; $env:SUPABASE_SERVICE_ROLE_KEY="key"; node src/lib/ai/datasets/seed-training-data.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// SEED USER PROFILES
// ============================================================================
// Based on DATA_COLLECTION_GUIDE.md requirements:
// - Budget traveler
// - Luxury traveler
// - Solo introvert
// - Extrovert group-friendly
// - Short-trip vs long-trip

const seedUsers = [
  {
    // 1. Budget Traveler
    clerk_user_id: 'seed_budget_traveler_001',
    profile: {
      username: 'budget_traveler_001',
      name: 'Budget Traveler',
      age: 28,
      gender: 'Male',
      personality: 'ambivert',
      smoking: 'No',
      drinking: 'No', // Changed to match schema constraint
      religion: 'hindu',
      food_preference: 'veg',
      nationality: 'Indian',
      job: 'student',
      languages: ['english', 'hindi'],
      location: 'Mumbai',
      profile_photo: null,
      bio: 'Budget-conscious traveler looking for affordable adventures',
      email: 'budget.traveler@seed.test',
      interests: ['budget travel', 'backpacking', 'hostels', 'street food'],
      verified: true,
      deleted: false,
      birthday: calculateBirthday(28), // Calculate from age
    },
    travel_preferences: {
      destinations: ['Goa', 'Manali', 'Rishikesh'],
      trip_focus: ['budget', 'adventure'],
      frequency: 'Every 6 months',
    },
    travel_modes: ['solo', 'group'],
  },
  {
    // 2. Luxury Traveler
    clerk_user_id: 'seed_luxury_traveler_002',
    profile: {
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
      profile_photo: null,
      bio: 'Luxury travel enthusiast seeking premium experiences',
      email: 'luxury.traveler@seed.test',
      interests: ['luxury travel', 'fine dining', 'spas', 'premium hotels'],
      verified: true,
      deleted: false,
      birthday: calculateBirthday(35),
    },
    travel_preferences: {
      destinations: ['Maldives', 'Dubai', 'Singapore'],
      trip_focus: ['luxury', 'relaxation'],
      frequency: 'Once a year',
    },
    travel_modes: ['group'],
  },
  {
    // 3. Solo Introvert
    clerk_user_id: 'seed_solo_introvert_003',
    profile: {
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
      profile_photo: null,
      bio: 'Solo traveler who prefers quiet exploration and meaningful connections',
      email: 'solo.introvert@seed.test',
      interests: ['solo travel', 'museums', 'reading', 'photography'],
      verified: true,
      deleted: false,
      birthday: calculateBirthday(26),
    },
    travel_preferences: {
      destinations: ['Kerala', 'Himachal Pradesh', 'Sikkim'],
      trip_focus: ['solo', 'nature', 'culture'],
      frequency: 'Monthly',
    },
    travel_modes: ['solo'],
  },
  {
    // 4. Extrovert Group-Friendly
    clerk_user_id: 'seed_extrovert_group_004',
    profile: {
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
      profile_photo: null,
      bio: 'Love group travel and meeting new people! Always up for adventures',
      email: 'extrovert.group@seed.test',
      interests: ['group travel', 'nightlife', 'adventure sports', 'social events'],
      verified: true,
      deleted: false,
      birthday: calculateBirthday(30),
    },
    travel_preferences: {
      destinations: ['Goa', 'Manali', 'Rajasthan'],
      trip_focus: ['group', 'adventure', 'nightlife'],
      frequency: 'Every 6 months',
    },
    travel_modes: ['group'],
  },
  {
    // 5. Short-Trip Traveler
    clerk_user_id: 'seed_short_trip_005',
    profile: {
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
      profile_photo: null,
      bio: 'Weekend warrior - love short getaways and quick adventures',
      email: 'short.trip@seed.test',
      interests: ['weekend trips', 'city breaks', 'quick adventures'],
      verified: true,
      deleted: false,
      birthday: calculateBirthday(25),
    },
    travel_preferences: {
      destinations: ['Mumbai', 'Pune', 'Goa'],
      trip_focus: ['weekend', 'city'],
      frequency: 'Monthly',
    },
    travel_modes: ['solo', 'group'],
  },
  {
    // 6. Long-Trip Traveler
    clerk_user_id: 'seed_long_trip_006',
    profile: {
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
      job: 'freelancer',
      languages: ['english', 'hindi'],
      location: 'Hyderabad',
      profile_photo: null,
      bio: 'Digital nomad who loves extended travel and slow exploration',
      email: 'long.trip@seed.test',
      interests: ['long-term travel', 'digital nomad', 'slow travel', 'cultural immersion'],
      verified: true,
      deleted: false,
      birthday: calculateBirthday(32),
    },
    travel_preferences: {
      destinations: ['Nepal', 'Thailand', 'Sri Lanka'],
      trip_focus: ['long-term', 'cultural', 'nomad'],
      frequency: 'Digital nomad',
    },
    travel_modes: ['solo', 'group'],
  },
];

// ============================================================================
// SEED GROUP PROFILES
// ============================================================================
// Based on DATA_COLLECTION_GUIDE.md requirements:
// - Small backpacker group
// - Large international group
// - Low-budget group
// - Activity-focused group

const seedGroups = [
  {
    // 1. Small Backpacker Group
    name: 'Small Backpacker Group',
    destination: 'Goa',
    budget: 15000,
    start_date: '2025-06-01',
    end_date: '2025-06-07',
    description: 'Small group of backpackers exploring Goa on a budget',
    is_public: true,
    non_smokers: false,
    non_drinkers: false,
    dominant_languages: ['english', 'hindi'],
    top_interests: ['backpacking', 'beaches', 'budget travel'],
    average_age: 26.5,
    members_count: 4,
    status: 'active',
    flag_count: 0,
  },
  {
    // 2. Large International Group
    name: 'Large International Group',
    destination: 'Mumbai',
    budget: 50000,
    start_date: '2025-07-15',
    end_date: '2025-07-25',
    description: 'Diverse international group exploring Mumbai',
    is_public: true,
    non_smokers: true,
    non_drinkers: false,
    dominant_languages: ['english', 'hindi', 'spanish', 'french'],
    top_interests: ['culture', 'food', 'history', 'photography'],
    average_age: 30.25,
    members_count: 8,
    status: 'active',
    flag_count: 0,
  },
  {
    // 3. Low-Budget Group
    name: 'Low-Budget Travel Group',
    destination: 'Delhi',
    budget: 10000,
    start_date: '2025-08-01',
    end_date: '2025-08-05',
    description: 'Budget-conscious travelers exploring Delhi',
    is_public: true,
    non_smokers: true,
    non_drinkers: true,
    dominant_languages: ['english', 'hindi'],
    top_interests: ['budget travel', 'street food', 'local culture'],
    average_age: 24.0,
    members_count: 5,
    status: 'active',
    flag_count: 0,
  },
  {
    // 4. Activity-Focused Group
    name: 'Adventure Activity Group',
    destination: 'Manali',
    budget: 35000,
    start_date: '2025-09-10',
    end_date: '2025-09-17',
    description: 'Adventure enthusiasts for trekking and outdoor activities',
    is_public: true,
    non_smokers: true,
    non_drinkers: false,
    dominant_languages: ['english', 'hindi'],
    top_interests: ['adventure', 'trekking', 'outdoor activities', 'mountains'],
    average_age: 28.5,
    members_count: 6,
    status: 'active',
    flag_count: 0,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate birthday from age (approximate - uses Jan 1st as default)
 */
function calculateBirthday(age) {
  const today = new Date();
  const birthYear = today.getFullYear() - age;
  // Use January 1st as default birthday
  return `${birthYear}-01-01`;
}

async function createSeedUser(userData) {
  try {
    // Step 1: Check if user already exists
    let userRecord;
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userData.clerk_user_id)
      .single();

    if (existingUser) {
      userRecord = existingUser;
      console.log(`ℹ️  User already exists: ${userData.clerk_user_id} (ID: ${userRecord.id})`);
    } else {
      // Create new user
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: uuidv4(),
          clerk_user_id: userData.clerk_user_id,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (userError) {
        console.error(`❌ Error creating user ${userData.clerk_user_id}:`, userError);
        return null;
      }

      userRecord = newUser;
      console.log(`✅ Created user: ${userData.clerk_user_id} (ID: ${userRecord.id})`);
    }

    // Step 2: Check if profile exists, update or create
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userRecord.id)
      .single();

    let profileRecord;
    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          ...userData.profile,
          languages: userData.profile.languages,
          interests: userData.profile.interests,
        })
        .eq('user_id', userRecord.id)
        .select()
        .single();

      if (updateError) {
        console.error(`❌ Error updating profile for ${userData.clerk_user_id}:`, updateError);
        return null;
      }

      profileRecord = updatedProfile;
      console.log(`✅ Updated profile for: ${userData.profile.name}`);
    } else {
      // Create new profile
      const { data: newProfile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userRecord.id,
          ...userData.profile,
          languages: userData.profile.languages,
          interests: userData.profile.interests,
        })
        .select()
        .single();

      if (profileError) {
        console.error(`❌ Error creating profile for ${userData.clerk_user_id}:`, profileError);
        return null;
      }

      profileRecord = newProfile;
      console.log(`✅ Created profile for: ${userData.profile.name}`);
    }

    // Step 3: Handle travel preferences (if provided)
    if (userData.travel_preferences) {
      // Check if preferences exist
      const { data: existingPrefs } = await supabase
        .from('travel_preferences')
        .select('id')
        .eq('user_id', userRecord.id)
        .single();

      if (existingPrefs) {
        // Update existing preferences
        const { error: updateError } = await supabase
          .from('travel_preferences')
          .update({
            destinations: userData.travel_preferences.destinations,
            trip_focus: userData.travel_preferences.trip_focus,
            frequency: userData.travel_preferences.frequency,
          })
          .eq('user_id', userRecord.id);

        if (updateError) {
          console.warn(`⚠️  Warning: Could not update travel preferences: ${updateError.message}`);
        } else {
          console.log(`✅ Updated travel preferences`);
        }
      } else {
        // Create new preferences
        const { error: prefError } = await supabase
          .from('travel_preferences')
          .insert({
            user_id: userRecord.id,
            destinations: userData.travel_preferences.destinations,
            trip_focus: userData.travel_preferences.trip_focus,
            frequency: userData.travel_preferences.frequency,
          });

        if (prefError) {
          console.warn(`⚠️  Warning: Could not create travel preferences: ${prefError.message}`);
        } else {
          console.log(`✅ Created travel preferences`);
        }
      }
    }

    // Step 4: Handle travel modes (if provided)
    if (userData.travel_modes && Array.isArray(userData.travel_modes)) {
      // Delete existing modes for this user
      await supabase
        .from('travel_modes')
        .delete()
        .eq('user_id', userRecord.id);

      // Insert new modes
      for (const mode of userData.travel_modes) {
        const { error: modeError } = await supabase
          .from('travel_modes')
          .insert({
            user_id: userRecord.id,
            mode: mode,
          });

        if (modeError) {
          console.warn(`⚠️  Warning: Could not create travel mode ${mode}: ${modeError.message}`);
        }
      }
      console.log(`✅ Updated travel modes: ${userData.travel_modes.join(', ')}`);
    }

    return { user: userRecord, profile: profileRecord };
  } catch (error) {
    console.error(`❌ Unexpected error creating user ${userData.clerk_user_id}:`, error);
    return null;
  }
}

async function createSeedGroup(groupData, creatorUserId) {
  try {
    // Check if group already exists (by name and creator)
    const { data: existingGroup } = await supabase
      .from('groups')
      .select('id')
      .eq('name', groupData.name)
      .eq('creator_id', creatorUserId)
      .single();

    // Common destination coordinates
    const destinationCoords = {
      'Goa': { lat: 15.2993, lon: 74.1240 },
      'Mumbai': { lat: 19.0760, lon: 72.8777 },
      'Delhi': { lat: 28.6139, lon: 77.2090 },
      'Manali': { lat: 32.2432, lon: 77.1892 },
    };

    const coords = destinationCoords[groupData.destination] || { lat: null, lon: null };

    let groupRecord;
    if (existingGroup) {
      // Update existing group
      const { data: updatedGroup, error: updateError } = await supabase
        .from('groups')
        .update({
          destination: groupData.destination,
          destination_lat: coords.lat,
          destination_lon: coords.lon,
          budget: groupData.budget,
          start_date: groupData.start_date,
          end_date: groupData.end_date,
          description: groupData.description,
          is_public: groupData.is_public !== undefined ? groupData.is_public : true,
          non_smokers: groupData.non_smokers,
          non_drinkers: groupData.non_drinkers,
          dominant_languages: groupData.dominant_languages,
          top_interests: groupData.top_interests,
          average_age: groupData.average_age,
          members_count: groupData.members_count,
          status: groupData.status || 'active',
          flag_count: groupData.flag_count !== undefined ? groupData.flag_count : 0,
        })
        .eq('id', existingGroup.id)
        .select()
        .single();

      if (updateError) {
        console.error(`❌ Error updating group ${groupData.name}:`, updateError);
        return null;
      }

      groupRecord = updatedGroup;
      console.log(`✅ Updated group: ${groupData.name} (ID: ${groupRecord.id})`);
    } else {
      // Create new group
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          id: uuidv4(),
          creator_id: creatorUserId,
          name: groupData.name,
          destination: groupData.destination,
          destination_lat: coords.lat,
          destination_lon: coords.lon,
          budget: groupData.budget,
          start_date: groupData.start_date,
          end_date: groupData.end_date,
          description: groupData.description,
          is_public: groupData.is_public !== undefined ? groupData.is_public : true,
          non_smokers: groupData.non_smokers,
          non_drinkers: groupData.non_drinkers,
          dominant_languages: groupData.dominant_languages,
          top_interests: groupData.top_interests,
          average_age: groupData.average_age,
          members_count: groupData.members_count,
          status: groupData.status || 'active',
          flag_count: groupData.flag_count !== undefined ? groupData.flag_count : 0,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (groupError) {
        console.error(`❌ Error creating group ${groupData.name}:`, groupError);
        return null;
      }

      groupRecord = newGroup;
      console.log(`✅ Created group: ${groupData.name} (ID: ${groupRecord.id})`);
    }

    return groupRecord;
  } catch (error) {
    console.error(`❌ Unexpected error creating group ${groupData.name}:`, error);
    return null;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🌱 Starting seed data creation for ML training...\n');

  // Create seed users
  console.log('👤 Creating seed users...');
  const createdUsers = [];
  for (const userData of seedUsers) {
    const result = await createSeedUser(userData);
    if (result) {
      createdUsers.push(result);
    }
  }

  console.log(`\n✅ Created ${createdUsers.length}/${seedUsers.length} users\n`);

  // Create seed groups (using first user as creator)
  if (createdUsers.length === 0) {
    console.error('❌ No users created. Cannot create groups.');
    process.exit(1);
  }

  console.log('👥 Creating seed groups...');
  const creatorId = createdUsers[0].user.id;
  const createdGroups = [];
  
  for (const groupData of seedGroups) {
    const result = await createSeedGroup(groupData, creatorId);
    if (result) {
      createdGroups.push(result);
    }
  }

  console.log(`\n✅ Created ${createdGroups.length}/${seedGroups.length} groups\n`);

  // Summary
  console.log('='.repeat(60));
  console.log('📊 SEED DATA SUMMARY');
  console.log('='.repeat(60));
  console.log(`Users created: ${createdUsers.length}`);
  console.log(`Groups created: ${createdGroups.length}`);
  console.log('\n✅ Seed data creation complete!');
  console.log('\nNext steps:');
  console.log('1. Use these seed profiles for testing');
  console.log('2. Run scripted interaction scenarios');
  console.log('3. Collect logs: npm run dev > app.log 2>&1');
  console.log('4. Extract events: grep "[ML_MATCH_EVENT]" app.log > match_events.jsonl');
  console.log('5. Build dataset: python src/lib/ai/datasets/build_training_set.py match_events.jsonl');
}

main().catch(console.error);

