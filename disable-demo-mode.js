/**
 * Disable Demo Mode
 * This disables mock users from appearing in match results
 * 
 * Run this script to disable demo mode:
 * node disable-demo-mode.js
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

async function disableDemoMode() {
  try {
    console.log('🚫 Disabling demo mode...');
    
    // Update the demo_mode setting
    const { data, error } = await supabase
      .from('system_settings')
      .update({
        value: { enabled: false },
        updated_at: new Date().toISOString(),
      })
      .eq('key', 'demo_mode')
      .select()
      .single();

    if (error) {
      // If setting doesn't exist, that's fine - it's already disabled
      if (error.code === 'PGRST116') {
        console.log('✅ Demo mode is already disabled');
        return;
      }
      console.error('❌ Error disabling demo mode:', error);
      process.exit(1);
    }

    console.log('✅ Demo mode disabled successfully!');
    console.log('📝 Mock users will no longer appear in matches');
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

disableDemoMode();

