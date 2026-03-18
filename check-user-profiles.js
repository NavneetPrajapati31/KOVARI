/**
 * Check profiles for the 3 inserted users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_USERS = [
  'user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9',
  'user_2zghYyxAutjzjAGehuA2xjI1XxQ',
  'user_36Z05CDtB7mzL7rJBwAVfblep2k'
];

async function checkProfiles() {
  console.log('🔍 Checking User Profiles\n');
  console.log('='.repeat(80));

  // First get the user UUIDs
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, clerk_user_id')
    .in('clerk_user_id', TARGET_USERS);

  if (usersError) {
    console.error(`❌ Error fetching users: ${usersError.message}`);
    return;
  }

  if (!users || users.length === 0) {
    console.error('❌ No users found');
    return;
  }

  console.log(`✅ Found ${users.length} users\n`);

  // Check profiles for each user
  for (const user of users) {
    console.log(`📋 User: ${user.clerk_user_id}`);
    console.log(`   UUID: ${user.id}`);
    console.log('-'.repeat(80));

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error(`   ❌ Error: ${profileError.message}`);
      continue;
    }

    if (!profile) {
      console.log(`   ⚠️  No profile found for this user`);
      console.log(`   💡 Need to insert profile with user_id: ${user.id}`);
    } else {
      console.log(`   ✅ Profile found:`);
      console.log(`      Username: ${profile.username}`);
      console.log(`      Name: ${profile.name || 'N/A'}`);
      console.log(`      Age: ${profile.age || 'N/A'}`);
      console.log(`      Personality: ${profile.personality || 'N/A'}`);
      console.log(`      Interests: ${Array.isArray(profile.interests) ? profile.interests.join(', ') : 'N/A'}`);
      console.log(`      Location: ${profile.location || 'N/A'}`);
      console.log(`      Religion: ${profile.religion || 'N/A'}`);
      console.log(`      Smoking: ${profile.smoking || 'N/A'}`);
      console.log(`      Drinking: ${profile.drinking || 'N/A'}`);
      console.log(`      Food Preference: ${profile.food_preference || 'N/A'}`);
      console.log(`      Gender: ${profile.gender || 'N/A'}`);
      console.log(`      Languages: ${Array.isArray(profile.languages) ? profile.languages.join(', ') : 'N/A'}`);
      console.log(`      Nationality: ${profile.nationality || 'N/A'}`);
      console.log(`      Job: ${profile.job || 'N/A'}`);
    }
    console.log('');
  }

  // Summary
  console.log('='.repeat(80));
  const profilesFound = users.filter(u => {
    // We'll check this in the loop above
    return true; // Placeholder
  });

  console.log(`\n📊 Summary: ${users.length} users found`);
  console.log(`💡 If profiles are missing, insert them using the user_id values shown above`);
  console.log('='.repeat(80));
}

checkProfiles()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
