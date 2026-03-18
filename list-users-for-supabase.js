/**
 * List User IDs for Supabase
 * 
 * Generates a list of user IDs from Redis sessions that need to be added to Supabase
 * Also provides SQL template for adding them
 */

const { createClient } = require('redis');
require('dotenv').config({ path: '.env.local' });

async function listUsersForSupabase() {
  console.log('📋 Listing User IDs for Supabase\n');
  console.log('='.repeat(80));

  let redisClient;

  try {
    // Connect to Redis
    redisClient = createClient({
      url: process.env.REDIS_URL,
    });

    await redisClient.connect();
    console.log('✅ Connected to Redis\n');

    // Get all session keys
    const keys = await redisClient.keys('session:*');
    console.log(`📊 Found ${keys.length} active sessions\n`);

    if (keys.length === 0) {
      console.log('⚠️  No active sessions found');
      await redisClient.quit();
      return;
    }

    // Get all sessions
    const sessions = await redisClient.mGet(keys);

    // Extract user IDs
    const userIds = keys.map(key => key.replace('session:', ''));

    console.log('='.repeat(80));
    console.log('📝 USER IDs TO ADD TO SUPABASE');
    console.log('='.repeat(80));
    console.log('\nCopy these user IDs:\n');

    userIds.forEach((userId, index) => {
      console.log(`${index + 1}. ${userId}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('📝 SQL TEMPLATE FOR SUPABASE');
    console.log('='.repeat(80));
    console.log('\nRun this SQL in Supabase SQL Editor:\n');

    console.log('-- Step 1: Insert users into users table');
    console.log('INSERT INTO users (clerk_user_id, created_at) VALUES');
    
    userIds.forEach((userId, index) => {
      const comma = index < userIds.length - 1 ? ',' : ';';
      console.log(`  ('${userId}', NOW())${comma}`);
    });

    console.log('\n-- Step 2: Insert profiles for each user');
    console.log('-- (You\'ll need to provide age, interests, personality, etc.)');
    console.log('-- Example:');
    console.log('INSERT INTO profiles (user_id, age, personality, interests, username, location, religion, smoking, drinking, deleted)');
    console.log('SELECT id, 25, \'ambivert\', ARRAY[\'travel\', \'photography\'], \'user_' + userIds[0].substring(5, 10) + '\', \'Mumbai\', \'hindu\', \'No\', \'socially\', false');
    console.log('FROM users WHERE clerk_user_id = \'' + userIds[0] + '\';');

    console.log('\n' + '='.repeat(80));
    console.log('📋 DETAILED USER LIST');
    console.log('='.repeat(80));

    // Get session details
    sessions.forEach((sessionJson, index) => {
      if (!sessionJson) return;
      
      try {
        const session = JSON.parse(sessionJson);
        const userId = userIds[index];
        
        console.log(`\n${index + 1}. User ID: ${userId}`);
        console.log(`   Destination: ${session.destination?.name || 'N/A'}`);
        console.log(`   Dates: ${session.startDate} to ${session.endDate}`);
        console.log(`   Budget: ₹${session.budget?.toLocaleString() || 'N/A'}`);
        
        if (session.static_attributes) {
          console.log(`   Age: ${session.static_attributes.age || 'N/A'}`);
          console.log(`   Personality: ${session.static_attributes.personality || 'N/A'}`);
          console.log(`   Interests: ${session.static_attributes.interests?.length || 0} items`);
        } else {
          console.log(`   ⚠️  No static_attributes in session`);
        }
      } catch (error) {
        console.log(`\n${index + 1}. User ID: ${userIds[index]}`);
        console.log(`   ⚠️  Failed to parse session`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('💡 QUICK REFERENCE');
    console.log('='.repeat(80));
    console.log('\nUser IDs (comma-separated):');
    console.log(userIds.join(', '));

    console.log('\n' + '='.repeat(80));
    console.log('✅ Complete!');
    console.log('='.repeat(80));
    console.log('\nNext steps:');
    console.log('1. Copy the user IDs above');
    console.log('2. Add them to Supabase users table');
    console.log('3. Create profiles for each user with age, interests, personality');
    console.log('4. Test ML predictions again - scores should now vary more!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (redisClient) {
      await redisClient.quit();
      console.log('\n✅ Disconnected from Redis');
    }
  }
}

listUsersForSupabase().catch(console.error);
