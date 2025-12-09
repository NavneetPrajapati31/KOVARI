#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Debugging Supabase Constraints Issue\n');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugConstraints() {
  try {
    console.log('🔗 Connecting to Supabase...');
    
    // 1. Check current profiles count
    console.log('\n📊 Step 1: Check current profiles count');
    const { data: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' });
    
    if (profilesError) {
      console.error('❌ Error checking profiles:', profilesError.message);
    } else {
      console.log(`✅ Current profiles count: ${profilesCount?.length || 0}`);
    }
    
    // 2. Check current users count
    console.log('\n📊 Step 2: Check current users count');
    const { data: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact' });
    
    if (usersError) {
      console.error('❌ Error checking users:', usersError.message);
    } else {
      console.log(`✅ Current users count: ${usersCount?.length || 0}`);
    }
    
    // 3. Try to create a single test user
    console.log('\n🧪 Step 3: Try to create a single test user');
    const testUserId = 'clerk_test_debug_123';
    
    // First, delete if exists
    await supabase.from('users').delete().eq('clerk_user_id', testUserId);
    await supabase.from('profiles').delete().eq('username', 'test_debug_user');
    
    // Create user
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({ clerk_user_id: testUserId })
      .select()
      .single();
    
    if (createUserError) {
      console.error('❌ Error creating user:', createUserError.message);
      return;
    }
    
    console.log(`✅ Created test user with ID: ${newUser.id}`);
    
    // 4. Try to create profile
    console.log('\n🧪 Step 4: Try to create profile for test user');
    const { data: newProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        user_id: newUser.id,
        username: 'test_debug_user',
        name: 'Test Debug User',
        age: 25,
        gender: 'male',
        personality: 'ambivert',
        smoking: 'No',
        drinking: 'No',
        religion: 'hindu',
        food_prefrence: 'veg',
        nationality: 'indian',
        job: 'tester',
        languages: ['english'],
        location: 'Test City',
        profile_photo: 'https://example.com/photo.jpg',
        bio: 'Test user for debugging',
        number: '+919999999999',
        email: 'test@debug.com',
        birthday: '2000-01-01',
        verified: true
      })
      .select()
      .single();
    
    if (createProfileError) {
      console.error('❌ Error creating profile:', createProfileError.message);
      console.error('❌ Error details:', JSON.stringify(createProfileError, null, 2));
    } else {
      console.log(`✅ Successfully created profile with ID: ${newProfile.id}`);
    }
    
    // 5. Check if there are any triggers or constraints
    console.log('\n🔍 Step 5: Check for any database triggers or constraints');
    console.log('Note: This would require direct database access to inspect');
    
    // 6. Cleanup test data
    console.log('\n🧹 Step 6: Cleanup test data');
    await supabase.from('profiles').delete().eq('username', 'test_debug_user');
    await supabase.from('users').delete().eq('clerk_user_id', testUserId);
    console.log('✅ Cleaned up test data');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Full error:', JSON.stringify(error, null, 2));
  }
}

// Run the debug function
debugConstraints().catch(error => {
  console.error('❌ Script failed:', error.message);
  process.exit(1);
});
