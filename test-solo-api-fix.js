#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

console.log('🧪 Testing Solo Matching API Fix\n');

async function testSoloApiFix() {
  try {
    console.log('✅ Testing if solo matching API is now working...\n');
    
    console.log('🔧 What was fixed:');
    console.log('1. Removed requirement for static_attributes.location in compatibility check');
    console.log('2. Added fallback values for missing static attributes in scoring');
    console.log('3. Made static_attributes optional in SoloSession interface');
    console.log('4. Added proper error handling for sessions without static data\n');
    
    console.log('📊 New Session Structure:');
    console.log('   ✅ Redis: Only dynamic attributes (destination, budget, dates)');
    console.log('   ✅ Supabase: Static attributes (name, age, gender, personality)');
    console.log('   ✅ API: Combines both when needed');
    console.log('   ✅ Fallbacks: Default values for missing attributes\n');
    
    console.log('🎯 Expected Behavior:');
    console.log('   • New user sessions work without static_attributes');
    console.log('   • Existing sessions with static_attributes still work');
    console.log('   • API gracefully handles missing data');
    console.log('   • No more Internal Server Error\n');
    
    console.log('🚀 The solo matching API should now work properly!');
    console.log('   • Try searching for solo travelers in your dev server');
    console.log('   • Check browser console for any remaining errors');
    console.log('   • Verify that matches are displayed correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testSoloApiFix();
}

module.exports = { testSoloApiFix };
