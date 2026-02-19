/**
 * Check if a user exists in Supabase database
 * 
 * Usage: node check-user-in-database.js <clerk_user_id>
 * Example: node check-user-in-database.js user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkUser(clerkUserId) {
  console.log('🔍 Checking user in database...\n');
  console.log('='.repeat(80));
  console.log(`Clerk User ID: ${clerkUserId}`);
  console.log('='.repeat(80));

  try {
    // Check if user exists
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, clerk_user_id, created_at')
      .eq('clerk_user_id', clerkUserId)
      .maybeSingle();

    if (userError) {
      console.error('\n❌ Database Error:');
      console.error(`   Code: ${userError.code}`);
      console.error(`   Message: ${userError.message}`);
      console.error(`   Hint: ${userError.hint || 'N/A'}`);
      console.error(`   Details: ${userError.details || 'N/A'}`);
      return;
    }

    if (!userData) {
      console.log('\n❌ User NOT FOUND in database');
      console.log('\n💡 Possible reasons:');
      console.log('   1. User hasn\'t completed profile setup');
      console.log('   2. User was created in Clerk but not in Supabase');
      console.log('   3. Clerk ID mismatch');
      console.log('\n🔧 Solutions:');
      console.log('   1. Have user complete onboarding/profile setup');
      console.log('   2. Check if user exists in Clerk dashboard');
      console.log('   3. Verify Supabase connection and permissions');
      
      // Check if there are any similar users
      console.log('\n🔍 Checking for similar users...');
      const { data: allUsers } = await supabase
        .from('users')
        .select('id, clerk_user_id')
        .limit(10);
      
      if (allUsers && allUsers.length > 0) {
        console.log(`\n   Found ${allUsers.length} users in database (sample):`);
        allUsers.forEach((u, idx) => {
          console.log(`   ${idx + 1}. Clerk ID: ${u.clerk_user_id?.substring(0, 30)}...`);
        });
      } else {
        console.log('   No users found in database');
      }
      
      return;
    }

    console.log('\n✅ User FOUND in database:');
    console.log(`   Internal UUID: ${userData.id}`);
    console.log(`   Clerk User ID: ${userData.clerk_user_id}`);
    console.log(`   Created: ${userData.created_at || 'N/A'}`);

    // Check if user has a profile
    console.log('\n🔍 Checking user profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userData.id)
      .maybeSingle();

    if (profileError) {
      console.log(`   ⚠️  Error checking profile: ${profileError.message}`);
    } else if (!profileData) {
      console.log('   ⚠️  No profile found');
    } else {
      console.log('   ✅ Profile exists');
    }

    // Check if user has travel preferences
    console.log('\n🔍 Checking travel preferences...');
    const { data: prefsData, error: prefsError } = await supabase
      .from('travel_preferences')
      .select('*')
      .eq('user_id', userData.id)
      .maybeSingle();

    if (prefsError) {
      console.log(`   ⚠️  Error checking preferences: ${prefsError.message}`);
    } else if (!prefsData) {
      console.log('   ⚠️  No travel preferences found');
    } else {
      console.log('   ✅ Travel preferences exist');
    }

    // Check if user has a session in Redis
    console.log('\n🔍 Checking Redis session...');
    const { createClient: createRedisClient } = require('redis');
    const redisClient = createRedisClient({
      url: process.env.REDIS_URL,
    });
    
    try {
      await redisClient.connect();
      const sessionJson = await redisClient.get(`session:${clerkUserId}`);
      
      if (sessionJson) {
        const session = JSON.parse(sessionJson);
        console.log('   ✅ Session found in Redis');
        console.log(`      Destination: ${session.destination?.name || 'N/A'}`);
        console.log(`      Dates: ${session.startDate} to ${session.endDate}`);
        console.log(`      Budget: ₹${session.budget?.toLocaleString() || 'N/A'}`);
      } else {
        console.log('   ⚠️  No session found in Redis');
      }
      
      await redisClient.quit();
    } catch (redisError) {
      console.log(`   ⚠️  Error checking Redis: ${redisError.message}`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ User exists in database and is ready for matching');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ Unexpected error:');
    console.error(error);
  }
}

// Get user ID from command line
const clerkUserId = process.argv[2];

if (!clerkUserId) {
  console.error('❌ Error: Clerk User ID required');
  console.log('\nUsage: node check-user-in-database.js <clerk_user_id>');
  console.log('Example: node check-user-in-database.js user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9');
  process.exit(1);
}

checkUser(clerkUserId)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
