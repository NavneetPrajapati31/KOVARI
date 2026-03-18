/**
 * Check Supabase connection and list existing users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkConnection() {
  console.log('🔍 Checking Supabase Connection\n');
  console.log('='.repeat(80));

  try {
    // Test connection
    console.log('1. Testing connection...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (testError) {
      console.error(`   ❌ Connection failed: ${testError.message}`);
      console.error(`   Code: ${testError.code}`);
      console.error(`   Details: ${testError.details}`);
      return;
    }

    console.log('   ✅ Connection successful');

    // List all users
    console.log('\n2. Listing all users in users table...');
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, clerk_user_id, created_at')
      .order('created_at', { ascending: false })
      .limit(20);

    if (usersError) {
      console.error(`   ❌ Error: ${usersError.message}`);
      return;
    }

    console.log(`   Found ${allUsers.length} users:\n`);
    allUsers.forEach((user, idx) => {
      console.log(`   ${idx + 1}. Clerk ID: ${user.clerk_user_id}`);
      console.log(`      UUID: ${user.id}`);
      console.log(`      Created: ${user.created_at || 'N/A'}`);
      console.log('');
    });

    // Check for our specific users
    console.log('\n3. Checking for specific users...');
    const targetUsers = [
      'user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9',
      'user_2zghYyxAutjzjAGehuA2xjI1XxQ',
      'user_36Z05CDtB7mzL7rJBwAVfblep2k'
    ];

    for (const clerkId of targetUsers) {
      const { data: user, error } = await supabase
        .from('users')
        .select('id, clerk_user_id')
        .eq('clerk_user_id', clerkId)
        .maybeSingle();

      if (error) {
        console.log(`   ⚠️  ${clerkId}: Error - ${error.message}`);
      } else if (user) {
        console.log(`   ✅ ${clerkId}: Found (UUID: ${user.id})`);
        
        // Check profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, age, personality')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile) {
          console.log(`      Profile: ${profile.username} (age: ${profile.age}, personality: ${profile.personality})`);
        } else {
          console.log(`      ⚠️  No profile found`);
        }
      } else {
        console.log(`   ❌ ${clerkId}: Not found`);
      }
    }

    // Check profiles table
    console.log('\n4. Checking profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id, username, age, personality, location')
      .order('created_at', { ascending: false })
      .limit(10);

    if (profilesError) {
      console.error(`   ❌ Error: ${profilesError.message}`);
    } else {
      console.log(`   Found ${profiles.length} profiles:\n`);
      profiles.forEach((profile, idx) => {
        console.log(`   ${idx + 1}. Username: ${profile.username}`);
        console.log(`      Age: ${profile.age || 'N/A'}`);
        console.log(`      Personality: ${profile.personality || 'N/A'}`);
        console.log(`      Location: ${profile.location || 'N/A'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

checkConnection()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
