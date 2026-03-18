/**
 * Verify that users and profiles were inserted correctly into Supabase
 * 
 * This script checks:
 * 1. Users exist in the users table
 * 2. Profiles exist with all required fields
 * 3. Attributes are diverse (for ML feature extraction)
 * 
 * Usage: node verify-supabase-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Use service role key if available (bypasses RLS), otherwise use anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl,
  supabaseServiceKey || supabaseAnonKey
);

if (supabaseServiceKey) {
  console.log('ℹ️  Using SERVICE ROLE KEY (bypasses RLS)\n');
} else {
  console.log('ℹ️  Using ANON KEY (may be limited by RLS policies)\n');
}

const EXPECTED_USERS = [
  'user_2yjB4MN3UBKy4HzQxgYEHxb4BZ9',
  'user_2zghYyxAutjzjAGehuA2xjI1XxQ',
  'user_36Z05CDtB7mzL7rJBwAVfblep2k'
];

const REQUIRED_PROFILE_FIELDS = [
  'username',
  'age',
  'personality',
  'interests',
  'location',
  'religion',
  'smoking',
  'drinking',
  'food_preference'
];

async function verifyUsers() {
  console.log('🔍 Verifying Supabase Users and Profiles\n');
  console.log('='.repeat(80));
  
  let allPassed = true;
  const results = [];

  for (const clerkUserId of EXPECTED_USERS) {
    console.log(`\n📋 Checking: ${clerkUserId}`);
    console.log('-'.repeat(80));
    
    const result = {
      clerkUserId,
      userExists: false,
      profileExists: false,
      hasAllFields: false,
      missingFields: [],
      attributes: {}
    };

    try {
      // Check if user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, clerk_user_id, created_at')
        .eq('clerk_user_id', clerkUserId)
        .maybeSingle();

      if (userError) {
        console.error(`   ❌ Error querying user: ${userError.message}`);
        allPassed = false;
        results.push(result);
        continue;
      }

      if (!userData) {
        console.error(`   ❌ User NOT FOUND in users table`);
        allPassed = false;
        results.push(result);
        continue;
      }

      result.userExists = true;
      console.log(`   ✅ User found (UUID: ${userData.id})`);

      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userData.id)
        .maybeSingle();

      if (profileError) {
        console.error(`   ❌ Error querying profile: ${profileError.message}`);
        allPassed = false;
        results.push(result);
        continue;
      }

      if (!profileData) {
        console.error(`   ❌ Profile NOT FOUND`);
        allPassed = false;
        results.push(result);
        continue;
      }

      result.profileExists = true;
      console.log(`   ✅ Profile found`);

      // Check required fields
      const missingFields = [];
      for (const field of REQUIRED_PROFILE_FIELDS) {
        if (profileData[field] === null || profileData[field] === undefined) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        console.error(`   ❌ Missing required fields: ${missingFields.join(', ')}`);
        result.missingFields = missingFields;
        allPassed = false;
      } else {
        result.hasAllFields = true;
        console.log(`   ✅ All required fields present`);
      }

      // Store attributes for ML feature extraction
      result.attributes = {
        age: profileData.age,
        personality: profileData.personality,
        interests: profileData.interests,
        location: profileData.location,
        religion: profileData.religion,
        smoking: profileData.smoking,
        drinking: profileData.drinking,
        food_preference: profileData.food_preference,
        gender: profileData.gender,
        languages: profileData.languages,
        nationality: profileData.nationality,
        job: profileData.job
      };

      // Display attributes
      console.log(`\n   📊 Profile Attributes:`);
      console.log(`      Age: ${result.attributes.age || 'N/A'}`);
      console.log(`      Personality: ${result.attributes.personality || 'N/A'}`);
      console.log(`      Interests: ${Array.isArray(result.attributes.interests) ? result.attributes.interests.join(', ') : 'N/A'}`);
      console.log(`      Location: ${result.attributes.location || 'N/A'}`);
      console.log(`      Religion: ${result.attributes.religion || 'N/A'}`);
      console.log(`      Smoking: ${result.attributes.smoking || 'N/A'}`);
      console.log(`      Drinking: ${result.attributes.drinking || 'N/A'}`);
      console.log(`      Food Preference: ${result.attributes.food_preference || 'N/A'}`);
      console.log(`      Gender: ${result.attributes.gender || 'N/A'}`);
      console.log(`      Languages: ${Array.isArray(result.attributes.languages) ? result.attributes.languages.join(', ') : 'N/A'}`);
      console.log(`      Nationality: ${result.attributes.nationality || 'N/A'}`);
      console.log(`      Job: ${result.attributes.job || 'N/A'}`);

    } catch (error) {
      console.error(`   ❌ Unexpected error: ${error.message}`);
      allPassed = false;
    }

    results.push(result);
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(80));

  const passedCount = results.filter(r => r.userExists && r.profileExists && r.hasAllFields).length;
  console.log(`\n✅ Passed: ${passedCount}/${EXPECTED_USERS.length}`);
  console.log(`❌ Failed: ${EXPECTED_USERS.length - passedCount}/${EXPECTED_USERS.length}`);

  // Check attribute diversity
  console.log('\n🎯 Attribute Diversity Check (for ML feature extraction):');
  const ages = results.map(r => r.attributes.age).filter(a => a !== null && a !== undefined);
  const personalities = results.map(r => r.attributes.personality).filter(p => p);
  const uniquePersonalities = [...new Set(personalities)];
  const uniqueAges = [...new Set(ages)];

  console.log(`   Ages: ${ages.length > 0 ? ages.join(', ') : 'N/A'} (${uniqueAges.length} unique)`);
  console.log(`   Personalities: ${personalities.length > 0 ? personalities.join(', ') : 'N/A'} (${uniquePersonalities.length} unique)`);
  
  if (uniquePersonalities.length < 2) {
    console.log(`   ⚠️  Warning: Low personality diversity (need at least 2 different personalities)`);
    allPassed = false;
  } else {
    console.log(`   ✅ Good personality diversity`);
  }

  if (uniqueAges.length < 2) {
    console.log(`   ⚠️  Warning: Low age diversity (need at least 2 different ages)`);
    allPassed = false;
  } else {
    console.log(`   ✅ Good age diversity`);
  }

  // Detailed results
  console.log('\n📋 Detailed Results:');
  results.forEach((result, idx) => {
    console.log(`\n   ${idx + 1}. ${result.clerkUserId}`);
    console.log(`      User exists: ${result.userExists ? '✅' : '❌'}`);
    console.log(`      Profile exists: ${result.profileExists ? '✅' : '❌'}`);
    console.log(`      All fields present: ${result.hasAllFields ? '✅' : '❌'}`);
    if (result.missingFields.length > 0) {
      console.log(`      Missing: ${result.missingFields.join(', ')}`);
    }
  });

  console.log('\n' + '='.repeat(80));
  if (allPassed && passedCount === EXPECTED_USERS.length) {
    console.log('✅ ALL VERIFICATIONS PASSED!');
    console.log('✅ Users and profiles are ready for ML feature extraction');
    console.log('='.repeat(80));
    return true;
  } else {
    console.log('❌ SOME VERIFICATIONS FAILED');
    console.log('⚠️  Please review the errors above and fix them');
    console.log('='.repeat(80));
    return false;
  }
}

// Run verification
verifyUsers()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
