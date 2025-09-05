const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDatabaseSchema() {
  console.log('🔍 Checking database schema...\n');

  try {
    // Check users table structure
    console.log('1. Checking users table...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      console.error('❌ Error accessing users table:', usersError);
    } else {
      console.log('✅ Users table accessible');
      if (usersData && usersData.length > 0) {
        console.log('📋 Users table columns:', Object.keys(usersData[0]));
      }
    }

    // Check group_memberships table structure
    console.log('\n2. Checking group_memberships table...');
    const { data: membershipsData, error: membershipsError } = await supabase
      .from('group_memberships')
      .select('*')
      .limit(1);

    if (membershipsError) {
      console.error('❌ Error accessing group_memberships table:', membershipsError);
    } else {
      console.log('✅ Group_memberships table accessible');
      if (membershipsData && membershipsData.length > 0) {
        console.log('📋 Group_memberships table columns:', Object.keys(membershipsData[0]));
      }
    }

    // Check if there are any foreign key constraints that might be causing issues
    console.log('\n3. Testing group_memberships insertion...');
    
    // First, get a valid user ID
    const { data: testUser, error: testUserError } = await supabase
      .from('users')
      .select('id')
      .limit(1)
      .single();

    if (testUserError || !testUser) {
      console.error('❌ No test user found:', testUserError);
      return;
    }

    // Get a valid group ID
    const { data: testGroup, error: testGroupError } = await supabase
      .from('groups')
      .select('id')
      .limit(1)
      .single();

    if (testGroupError || !testGroup) {
      console.error('❌ No test group found:', testGroupError);
      return;
    }

    // Try to insert a test membership
    const testMembership = {
      group_id: testGroup.id,
      user_id: testUser.id,
      status: 'accepted',
      joined_at: new Date().toISOString(),
      role: 'member'
    };

    console.log('📝 Testing membership insertion with payload:', testMembership);

    const { data: insertData, error: insertError } = await supabase
      .from('group_memberships')
      .insert(testMembership)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Error inserting test membership:', insertError);
      
      if (insertError.message && insertError.message.includes('date_of_birth')) {
        console.error('\n🚨 DATABASE SCHEMA ISSUE DETECTED!');
        console.error('The error indicates that a database constraint or trigger is trying to access a "date_of_birth" column');
        console.error('that does not exist in the users table.');
        console.error('\nPossible solutions:');
        console.error('1. Check for database triggers that reference u.date_of_birth');
        console.error('2. Check for foreign key constraints that join with users table');
        console.error('3. Review the database schema for any references to date_of_birth');
        console.error('4. Check if there are any RLS policies that reference this column');
      }
    } else {
      console.log('✅ Test membership insertion successful');
      
      // Clean up the test data
      await supabase
        .from('group_memberships')
        .delete()
        .eq('id', insertData.id);
      
      console.log('🧹 Test data cleaned up');
    }

    // Check for any database functions or triggers
    console.log('\n4. Checking for potential database constraints...');
    console.log('💡 If you see date_of_birth errors, check:');
    console.log('   - Database triggers on group_memberships table');
    console.log('   - Foreign key constraints with users table');
    console.log('   - RLS policies that reference users table');
    console.log('   - Database functions that might be called on insert');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkDatabaseSchema()
  .then(() => {
    console.log('\n✅ Database schema check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Schema check failed:', error);
    process.exit(1);
  }); 