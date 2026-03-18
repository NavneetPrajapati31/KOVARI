/**
 * Check Active Redis Sessions
 * 
 * Lists all active user sessions stored in Redis
 */

const { createClient } = require('redis');
require('dotenv').config({ path: '.env.local' });

async function checkRedisSessions() {
  console.log('🔍 Checking Active Redis Sessions\n');
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

    // Parse and display sessions
    const parsedSessions = sessions
      .map((session, index) => {
        if (!session) return null;
        try {
          const parsed = JSON.parse(session);
          return {
            key: keys[index],
            userId: keys[index].replace('session:', ''),
            session: parsed,
          };
        } catch (error) {
          return {
            key: keys[index],
            userId: keys[index].replace('session:', ''),
            error: 'Failed to parse',
            raw: session.substring(0, 100),
          };
        }
      })
      .filter(Boolean);

    // Display sessions
    parsedSessions.forEach((item, index) => {
      console.log(`${'='.repeat(80)}`);
      console.log(`Session ${index + 1}/${parsedSessions.length}`);
      console.log(`Key: ${item.key}`);
      console.log(`User ID: ${item.userId}`);

      if (item.error) {
        console.log(`⚠️  ${item.error}`);
        console.log(`Raw: ${item.raw}...`);
      } else {
        const s = item.session;
        console.log(`Destination: ${s.destination?.name || 'N/A'}`);
        console.log(`Dates: ${s.startDate || 'N/A'} to ${s.endDate || 'N/A'}`);
        console.log(`Budget: ₹${s.budget?.toLocaleString() || 'N/A'}`);
        console.log(`Preset: ${s.preset || 'N/A'}`);
        console.log(`Created: ${s.createdAt || 'N/A'}`);
        
        if (s.static_attributes) {
          console.log(`Age: ${s.static_attributes.age || 'N/A'}`);
          console.log(`Personality: ${s.static_attributes.personality || 'N/A'}`);
          console.log(`Interests: ${s.static_attributes.interests?.length || 0} items`);
        }
      }
      console.log('');
    });

    // Summary
    console.log('='.repeat(80));
    console.log('📊 SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Sessions: ${parsedSessions.length}`);
    
    const validSessions = parsedSessions.filter(s => !s.error);
    console.log(`Valid Sessions: ${validSessions.length}`);
    console.log(`Invalid Sessions: ${parsedSessions.length - validSessions.length}`);

    // Group by preset
    const byPreset = {};
    validSessions.forEach(s => {
      const preset = s.session.preset || 'unknown';
      byPreset[preset] = (byPreset[preset] || 0) + 1;
    });

    if (Object.keys(byPreset).length > 0) {
      console.log('\nBy Preset:');
      Object.entries(byPreset).forEach(([preset, count]) => {
        console.log(`  ${preset}: ${count}`);
      });
    }

    // Group by destination
    const byDestination = {};
    validSessions.forEach(s => {
      const dest = s.session.destination?.name || 'unknown';
      byDestination[dest] = (byDestination[dest] || 0) + 1;
    });

    if (Object.keys(byDestination).length > 0) {
      console.log('\nBy Destination:');
      Object.entries(byDestination).forEach(([dest, count]) => {
        console.log(`  ${dest}: ${count}`);
      });
    }

    console.log('='.repeat(80));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Make sure Redis is running and REDIS_URL is correct in .env.local');
    }
  } finally {
    if (redisClient) {
      await redisClient.quit();
      console.log('\n✅ Disconnected from Redis');
    }
  }
}

checkRedisSessions().catch(console.error);
