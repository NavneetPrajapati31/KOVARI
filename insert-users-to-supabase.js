/**
 * Insert users and profiles into Supabase using service role key
 * This bypasses RLS (Row Level Security) policies
 * 
 * Usage: node insert-users-to-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n💡 Make sure these are set in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const USERS_TO_INSERT = [
  {
    clerk_user_id: 'user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9',
    profile: {
      username: 'user_traveler_001',
      name: 'Budget Traveler',
      age: 28,
      gender: 'Male',
      personality: 'ambivert',
      interests: ['budget travel', 'backpacking', 'street food', 'adventure'],
      location: 'Mumbai',
      religion: 'hindu',
      smoking: 'No',
      drinking: 'socially',
      job: 'student',
      languages: ['english', 'hindi'],
      nationality: 'Indian',
      food_preference: 'veg',
      deleted: false
    }
  },
  {
    clerk_user_id: 'user_2zghYyxAutjzjAGehuA2xjI1XxQ',
    profile: {
      username: 'user_traveler_002',
      name: 'Mid-Range Traveler',
      age: 32,
      gender: 'Female',
      personality: 'extrovert',
      interests: ['photography', 'culture', 'food', 'music'],
      location: 'Mumbai',
      religion: 'hindu',
      smoking: 'No',
      drinking: 'socially',
      job: 'designer',
      languages: ['english', 'hindi'],
      nationality: 'Indian',
      food_preference: 'veg',
      deleted: false
    }
  },
  {
    clerk_user_id: 'user_36Z05CDtB7mzL7rJBwAVfblep2k',
    profile: {
      username: 'user_traveler_003',
      name: 'Adventure Seeker',
      age: 25,
      gender: 'Male',
      personality: 'introvert',
      interests: ['adventure', 'hiking', 'nature', 'photography'],
      location: 'Mumbai',
      religion: 'agnostic',
      smoking: 'No',
      drinking: 'No',
      job: 'software_engineer',
      languages: ['english'],
      nationality: 'Indian',
      food_preference: 'veg',
      deleted: false
    }
  }
];

async function insertUsers() {
  console.log('🚀 Inserting Users and Profiles into Supabase\n');
  console.log('='.repeat(80));

  let successCount = 0;
  let errorCount = 0;

  for (const userData of USERS_TO_INSERT) {
    console.log(`\n📋 Processing: ${userData.clerk_user_id}`);
    console.log('-'.repeat(80));

    try {
      // Step 1: Insert or get user
      console.log('   Step 1: Inserting user...');
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_user_id', userData.clerk_user_id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`   ❌ Error checking user: ${checkError.message}`);
        errorCount++;
        continue;
      }

      let userId;
      if (existingUser) {
        console.log(`   ✅ User already exists (UUID: ${existingUser.id})`);
        userId = existingUser.id;
      } else {
        const { data: newUser, error: insertError } = await supabase
          .from('users')
          .insert({
            clerk_user_id: userData.clerk_user_id,
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (insertError) {
          console.error(`   ❌ Error inserting user: ${insertError.message}`);
          console.error(`   Code: ${insertError.code}`);
          console.error(`   Details: ${insertError.details}`);
          errorCount++;
          continue;
        }

        userId = newUser.id;
        console.log(`   ✅ User inserted (UUID: ${userId})`);
      }

      // Step 2: Insert or update profile
      console.log('   Step 2: Inserting/updating profile...');
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const profileData = {
        ...userData.profile,
        user_id: userId
      };

      let profileResult;
      if (existingProfile) {
        const { data, error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('user_id', userId)
          .select()
          .single();

        profileResult = { data, error };
        if (!error) {
          console.log(`   ✅ Profile updated`);
        }
      } else {
        const { data, error } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        profileResult = { data, error };
        if (!error) {
          console.log(`   ✅ Profile inserted`);
        }
      }

      if (profileResult.error) {
        console.error(`   ❌ Error with profile: ${profileResult.error.message}`);
        console.error(`   Code: ${profileResult.error.code}`);
        console.error(`   Details: ${profileResult.error.details}`);
        console.error(`   Hint: ${profileResult.error.hint || 'N/A'}`);
        errorCount++;
        continue;
      }

      // Display inserted profile
      if (profileResult.data) {
        console.log(`\n   📊 Profile Details:`);
        console.log(`      Username: ${profileResult.data.username}`);
        console.log(`      Age: ${profileResult.data.age}`);
        console.log(`      Personality: ${profileResult.data.personality}`);
        console.log(`      Interests: ${Array.isArray(profileResult.data.interests) ? profileResult.data.interests.join(', ') : 'N/A'}`);
        console.log(`      Location: ${profileResult.data.location}`);
      }

      successCount++;

    } catch (error) {
      console.error(`   ❌ Unexpected error: ${error.message}`);
      errorCount++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 INSERTION SUMMARY');
  console.log('='.repeat(80));
  console.log(`\n✅ Successfully inserted/updated: ${successCount}/${USERS_TO_INSERT.length}`);
  console.log(`❌ Failed: ${errorCount}/${USERS_TO_INSERT.length}`);

  if (successCount === USERS_TO_INSERT.length) {
    console.log('\n✅ ALL USERS AND PROFILES INSERTED SUCCESSFULLY!');
    console.log('✅ Ready for ML feature extraction');
  } else {
    console.log('\n⚠️  Some insertions failed. Please review the errors above.');
  }

  console.log('='.repeat(80));

  return successCount === USERS_TO_INSERT.length;
}

// Run insertion
insertUsers()
  .then((success) => {
    if (success) {
      console.log('\n💡 Next step: Run "node verify-supabase-users.js" to verify the data');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
