/**
 * Enable Demo Mode for Imagine Cup Demo
 * This allows mock users to appear in match results and work with interest features
 * 
 * Run this script to enable demo mode:
 * node enable-demo-mode.js
 */

// Load environment variables from .env.local file
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function enableDemoMode() {
  try {
    console.log('🎬 Enabling demo mode...');
    
    // Upsert the demo_mode setting
    const { data, error } = await supabase
      .from('system_settings')
      .upsert(
        {
          key: 'demo_mode',
          value: { enabled: true },
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'key',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('❌ Error enabling demo mode:', error);
      process.exit(1);
    }

    console.log('✅ Demo mode enabled successfully!');
    console.log('📝 Mock users (user_mumbai_1, user_mumbai_2, etc.) will now appear in matches');
    console.log('💡 To disable demo mode, run: node disable-demo-mode.js');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

enableDemoMode();

