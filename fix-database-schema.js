const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function diagnoseAndFixSchema() {
  console.log('🔧 Diagnosing database schema issue...\n');

  try {
    // Step 1: Check if the date_of_birth column exists in users table
    console.log('1. Checking users table structure...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('❌ Error accessing users table:', usersError);
      return;
    }

    if (usersData && usersData.length > 0) {
      const columns = Object.keys(usersData[0]);
      console.log('📋 Users table columns:', columns);
      
      if (columns.includes('date_of_birth')) {
        console.log('✅ date_of_birth column exists in users table');
      } else {
        console.log('❌ date_of_birth column does NOT exist in users table');
        console.log('💡 This is likely the source of the problem');
      }
    }

    // Step 2: Check group_memberships table structure
    console.log('\n2. Checking group_memberships table structure...');
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('group_memberships')
      .select('*')
      .limit(1);

    if (membershipsError) {
      console.error('❌ Error accessing group_memberships table:', membershipsError);
      return;
    }

    if (membershipsData && membershipsData.length > 0) {
      const columns = Object.keys(membershipsData[0]);
      console.log('📋 Group_memberships table columns:', columns);
    }

    // Step 3: Test the problematic insertion
    console.log('\n3. Testing the problematic insertion...');
    
    // Get a test user
    const { data: testUser, error: testUserError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();

    if (testUserError || !testUser) {
      console.error('❌ No test user found:', testUserError);
      return;
    }

    // Get a test group
    const { data: testGroup, error: testGroupError } = await supabase
      .from('groups')
      .select('id')
      .limit(1)
      .single();

    if (testGroupError || !testGroup) {
      console.error('❌ No test group found:', testGroupError);
      return;
    }

    // Test the exact same payload that's failing
    const testPayload = {
      group_id: testGroup.id,
      user_id: testUser.id,
      status: 'accepted',
      joined_at: new Date().toISOString(),
      role: 'admin'
    };

    console.log('📝 Testing with payload:', testPayload);

    const { data: insertData, error: insertError } = await supabase
      .from('group_memberships')
      .insert(testPayload)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Insertion failed:', insertError);
      
      if (insertError.message && insertError.message.includes('date_of_birth')) {
        console.error('\n🚨 CONFIRMED: Database schema issue with date_of_birth column');
        console.error('\n🔍 Root Cause Analysis:');
        console.error('The error suggests there is a database constraint, trigger, or RLS policy');
        console.error('that is trying to access a "date_of_birth" column in the users table.');
        console.error('\n📋 Possible causes:');
        console.error('1. Foreign key constraint with a join to users table');
        console.error('2. Database trigger on group_memberships table');
        console.error('3. RLS (Row Level Security) policy that references users.date_of_birth');
        console.error('4. Database function called on insert that references this column');
        
        console.error('\n🛠️  Recommended Solutions:');
        console.error('1. Check Supabase Dashboard > Database > Tables > group_memberships');
        console.error('2. Look for any triggers, constraints, or RLS policies');
        console.error('3. Check if there are any foreign key constraints that join with users table');
        console.error('4. Review any database functions that might be called on insert');
        console.error('5. Add the missing date_of_birth column to users table if needed');
        
        console.error('\n💡 Quick Fix Options:');
        console.error('Option A: Add date_of_birth column to users table');
        console.error('Option B: Remove/modify the constraint that references date_of_birth');
        console.error('Option C: Modify the RLS policy to not reference this column');
      }
    } else {
      console.log('✅ Insertion successful!');
      
      // Clean up
      await supabase
        .from('group_memberships')
        .delete()
        .eq('id', insertData.id);
      
      console.log('🧹 Test data cleaned up');
    }

    // Step 4: Provide SQL commands to help fix the issue
    console.log('\n4. Suggested SQL commands to fix the issue:');
    console.log('\n📝 To add the missing date_of_birth column:');
    console.log(`
ALTER TABLE users 
ADD COLUMN date_of_birth DATE;
    `);
    
    console.log('\n📝 To check for problematic constraints:');
    console.log(`
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'group_memberships';
    `);
    
    console.log('\n📝 To check for triggers:');
    console.log(`
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'group_memberships';
    `);
    
    console.log('\n📝 To check RLS policies:');
    console.log(`
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'group_memberships';
    `);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the diagnosis
diagnoseAndFixSchema()
  .then(() => {
    console.log('\n✅ Database schema diagnosis completed');
    console.log('\n💡 Next steps:');
    console.log('1. Run the suggested SQL commands in your Supabase SQL Editor');
    console.log('2. Check for any constraints, triggers, or policies that reference date_of_birth');
    console.log('3. Either add the missing column or remove the problematic constraint');
    console.log('4. Test the group creation functionality again');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Diagnosis failed:', error);
    process.exit(1);
  }); 