const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addAiOverviewColumn() {
  console.log('🔧 Adding ai_overview column to groups table...\n');

  try {
    // Check if column already exists
    console.log('1. Checking groups table structure...');
    const { data: groupsData, error: groupsError } = await supabase
      .from('groups')
      .select('*')
      .limit(1);

    if (groupsError) {
      console.error('❌ Error accessing groups table:', groupsError);
      return;
    }

    if (groupsData && groupsData.length > 0) {
        const columns = Object.keys(groupsData[0]);
        if (columns.includes('ai_overview')) {
            console.log('✅ ai_overview column already exists in groups table');
            return;
        }
    }

    // Try to add the column via raw SQL using a specific RPC if available, or just log instructions if not possible directly via JS client (Supabase JS client doesn't support generic DDL query execution without a custom RPC).
    // However, we can try to use the PostgreSQL driver if installed, but here we only have supabase-js.
    // Wait, the previous file fix-database-schema.js only logged instructions. It didn't actually execute DDL.
    // The user has "pg" likely not installed or not configured.
    // Let's look at fix-database-schema.js again. It says "4. Suggested SQL commands to fix the issue".
    // It seems I cannot run DDL from here directly unless I have a service role key and use a specific function, or use a PG client.
    
    console.log('\n⚠️  Cannot execute DDL (ALTER TABLE) directly via Supabase JS client without specific RPCs.');
    console.log('Please run the following SQL command in your Supabase SQL Editor:');
    console.log(`
ALTER TABLE groups 
ADD COLUMN IF NOT EXISTS ai_overview TEXT;
    `);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addAiOverviewColumn();
