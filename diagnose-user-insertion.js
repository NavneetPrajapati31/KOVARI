/**
 * Comprehensive diagnostic to check user insertion status
 * Checks both with anon key and provides detailed information
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const TARGET_USERS = [
  'user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9',
  'user_2zghYyxAutjzjAGehuA2xjI1XxQ',
  'user_36Z05CDtB7mzL7rJBwAVfblep2k'
];

async function diagnose() {
  console.log('🔍 Comprehensive User Insertion Diagnostic\n');
  console.log('='.repeat(80));

  // Check with anon key
  console.log('\n1. Checking with ANON KEY (what API sees)...');
  console.log('-'.repeat(80));
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);
  
  const { data: usersAnon, error: usersAnonError } = await supabaseAnon
    .from('users')
    .select('id, clerk_user_id, created_at')
    .in('clerk_user_id', TARGET_USERS);

  if (usersAnonError) {
    console.error(`   ❌ Error: ${usersAnonError.message}`);
    console.error(`   Code: ${usersAnonError.code}`);
  } else {
    console.log(`   Found ${usersAnon?.length || 0} users with anon key`);
    if (usersAnon && usersAnon.length > 0) {
      usersAnon.forEach(u => {
        console.log(`   ✅ ${u.clerk_user_id} (UUID: ${u.id})`);
      });
    }
  }

  // Check with service key (bypasses RLS)
  if (supabaseServiceKey) {
    console.log('\n2. Checking with SERVICE ROLE KEY (bypasses RLS)...');
    console.log('-'.repeat(80));
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    
    const { data: usersService, error: usersServiceError } = await supabaseService
      .from('users')
      .select('id, clerk_user_id, created_at')
      .in('clerk_user_id', TARGET_USERS);

    if (usersServiceError) {
      console.error(`   ❌ Error: ${usersServiceError.message}`);
      console.error(`   Code: ${usersServiceError.code}`);
    } else {
      console.log(`   Found ${usersService?.length || 0} users with service key`);
      if (usersService && usersService.length > 0) {
        usersService.forEach(u => {
          console.log(`   ✅ ${u.clerk_user_id} (UUID: ${u.id})`);
        });
      } else {
        console.log(`   ❌ No users found - data was NOT inserted`);
      }
    }

    // Check all users count
    const { count: totalUsersCount } = await supabaseService
      .from('users')
      .select('*', { count: 'exact', head: true });

    console.log(`\n   Total users in database: ${totalUsersCount || 0}`);

    // Check profiles with our usernames
    console.log('\n3. Checking profiles with expected usernames...');
    console.log('-'.repeat(80));
    const expectedUsernames = ['user_traveler_001', 'user_traveler_002', 'user_traveler_003'];
    
    const { data: profiles, error: profilesError } = await supabaseService
      .from('profiles')
      .select('user_id, username, age, personality, name')
      .in('username', expectedUsernames);

    if (profilesError) {
      console.error(`   ❌ Error: ${profilesError.message}`);
    } else {
      console.log(`   Found ${profiles?.length || 0} profiles with expected usernames`);
      if (profiles && profiles.length > 0) {
        profiles.forEach(p => {
          console.log(`   ✅ ${p.username}: ${p.name || 'N/A'} (age: ${p.age}, personality: ${p.personality})`);
          console.log(`      user_id: ${p.user_id || 'NULL (orphaned profile!)'}`);
        });
      } else {
        console.log(`   ❌ No profiles found with expected usernames`);
      }
    }
  } else {
    console.log('\n⚠️  SUPABASE_SERVICE_ROLE_KEY not found - skipping service key check');
  }

  // Check for profiles with NULL user_id (orphaned)
  console.log('\n4. Checking for orphaned profiles (user_id is NULL)...');
  console.log('-'.repeat(80));
  const supabaseCheck = supabaseServiceKey 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : supabaseAnon;

  const { data: orphanedProfiles, error: orphanedError } = await supabaseCheck
    .from('profiles')
    .select('id, username, user_id, name')
    .is('user_id', null)
    .limit(5);

  if (orphanedError) {
    console.log(`   ⚠️  Could not check: ${orphanedError.message}`);
  } else {
    console.log(`   Found ${orphanedProfiles?.length || 0} orphaned profiles (user_id is NULL)`);
    if (orphanedProfiles && orphanedProfiles.length > 0) {
      orphanedProfiles.forEach(p => {
        console.log(`   ⚠️  ${p.username}: user_id is NULL`);
      });
    }
  }

  // Summary and recommendations
  console.log('\n' + '='.repeat(80));
  console.log('📊 DIAGNOSTIC SUMMARY');
  console.log('='.repeat(80));

  const foundWithAnon = usersAnon && usersAnon.length > 0;
  const foundWithService = supabaseServiceKey && (usersService && usersService.length > 0);
  const foundProfiles = profiles && profiles.length > 0;

  if (foundWithService || (foundWithAnon && !supabaseServiceKey)) {
    console.log('\n✅ Users found in database');
    if (foundProfiles) {
      console.log('✅ Profiles found');
      console.log('\n💡 Next step: Run "node verify-supabase-users.js" to verify all attributes');
    } else {
      console.log('⚠️  Profiles not found - need to insert profiles');
    }
  } else {
    console.log('\n❌ Users NOT found in database');
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   1. Check if SQL was executed successfully in Supabase SQL Editor');
    console.log('   2. Check for any error messages in Supabase logs');
    console.log('   3. Verify RLS policies allow INSERT operations');
    console.log('   4. Try using the Node.js script: node insert-users-to-supabase.js');
    console.log('   5. Or manually insert using the data in MANUAL_USER_INSERT_DATA.md');
  }

  console.log('='.repeat(80));
}

diagnose()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
