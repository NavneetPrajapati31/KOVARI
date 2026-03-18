#!/usr/bin/env node

/**
 * Cleanup Placeholder Redis Sessions
 * 
 * This script removes Redis sessions that were created with placeholder Clerk IDs
 * (like seed_budget_traveler_001) so they don't appear as matches.
 * 
 * Usage:
 *   node cleanup-placeholder-sessions.js
 */

require('dotenv').config({ path: '.env.local' });
const redis = require('redis');

const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
  console.error('❌ Missing REDIS_URL in .env.local');
  process.exit(1);
}

async function cleanupPlaceholderSessions() {
  let redisClient;
  
  try {
    console.log('🔌 Connecting to Redis...');
    redisClient = redis.createClient({ url: REDIS_URL });
    await redisClient.connect();
    console.log('✅ Connected to Redis\n');
    
    // Get all session keys
    const allSessionKeys = await redisClient.keys('session:*');
    console.log(`📋 Found ${allSessionKeys.length} total sessions\n`);
    
    // Identify placeholder sessions (those starting with 'seed_' or other non-user_ patterns)
    const placeholderPatterns = [
      /^session:seed_/,
      /^session:user_mumbai_/,
      /^session:user_august_/,
      /^session:clerk_user_/,
    ];
    
    const placeholderSessions = [];
    const actualSessions = [];
    
    for (const key of allSessionKeys) {
      const userId = key.replace('session:', '');
      const isPlaceholder = placeholderPatterns.some(pattern => pattern.test(key)) || 
                           (!userId.startsWith('user_') && userId.length < 20);
      
      if (isPlaceholder) {
        placeholderSessions.push(key);
      } else {
        actualSessions.push(key);
      }
    }
    
    console.log(`📊 Session Analysis:`);
    console.log(`   Placeholder sessions: ${placeholderSessions.length}`);
    console.log(`   Actual user sessions: ${actualSessions.length}\n`);
    
    if (placeholderSessions.length === 0) {
      console.log('✅ No placeholder sessions found. Nothing to clean up.');
      return;
    }
    
    // Show what will be deleted
    console.log('🗑️  Placeholder sessions to delete:');
    placeholderSessions.forEach(key => {
      const userId = key.replace('session:', '');
      console.log(`   - ${key} (${userId})`);
    });
    console.log('');
    
    // Delete placeholder sessions
    console.log('🗑️  Deleting placeholder sessions...');
    let deletedCount = 0;
    
    for (const key of placeholderSessions) {
      try {
        await redisClient.del(key);
        deletedCount++;
        console.log(`   ✅ Deleted: ${key}`);
      } catch (error) {
        console.error(`   ❌ Error deleting ${key}:`, error.message);
      }
    }
    
    console.log(`\n✅ Deleted ${deletedCount}/${placeholderSessions.length} placeholder sessions\n`);
    
    // Verify remaining sessions
    const remainingKeys = await redisClient.keys('session:*');
    console.log(`📊 Remaining sessions: ${remainingKeys.length}`);
    
    if (remainingKeys.length > 0) {
      console.log('\n📋 Remaining sessions:');
      remainingKeys.forEach(key => {
        const userId = key.replace('session:', '');
        console.log(`   - ${key} (${userId})`);
      });
    }
    
    console.log('\n💡 Next steps:');
    console.log('   1. Log in as seed users through the app');
    console.log('   2. Create sessions via the dashboard (this will use actual Clerk IDs)');
    console.log('   3. These new sessions will not conflict with your logged-in user');
    
  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    if (redisClient) {
      await redisClient.quit();
      console.log('\n🔌 Disconnected from Redis');
    }
  }
}

// Run the script
cleanupPlaceholderSessions().catch(console.error);
