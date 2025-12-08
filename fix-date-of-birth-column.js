const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function fixDateOfBirthColumn() {
  console.log('🔧 Fixing missing date_of_birth column...\n');

  try {
    // Step 1: Check if the date_of_birth column already exists
    console.log('1. Checking if date_of_birth column exists...');
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
        console.log('✅ date_of_birth column already exists in users table');
        console.log('💡 The issue might be elsewhere. Check for triggers or constraints.');
        return;
      } else {
        console.log('❌ date_of_birth column does NOT exist in users table');
        console.log('💡 This is the source of the problem');
      }
    }

    // Step 2: Add the missing column using SQL
    console.log('\n2. Adding date_of_birth column to users table...');
    
    // Note: We can't use Supabase client to run DDL statements
    // This needs to be done in the Supabase SQL Editor
    console.log('📝 Please run this SQL command in your Supabase SQL Editor:');
    console.log(`
ALTER TABLE users 
ADD COLUMN date_of_birth DATE;
    `);
    
    console.log('\n💡 Instructions:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the above SQL command');
    console.log('4. Test the group creation functionality again');

    // Step 3: Test if the fix works
    console.log('\n3. Testing the fix...');
    console.log('📝 After adding the column, test group creation again.');
    console.log('📝 The error should be resolved once the column is added.');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixDateOfBirthColumn()
  .then(() => {
    console.log('\n✅ Database schema fix instructions completed');
    console.log('\n💡 Next steps:');
    console.log('1. Run the SQL command in Supabase SQL Editor');
    console.log('2. Test group creation functionality');
    console.log('3. If issues persist, check for other constraints or triggers');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }); 