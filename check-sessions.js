require('dotenv').config({ path: '.env.local' });
const redis = require('redis');

const client = redis.createClient({ url: process.env.REDIS_URL });

async function checkSessions() {
  try {
    await client.connect();
    const keys = await client.keys('session:*');
    const sessions = await Promise.all(
      keys.map(async (k) => {
        const v = await client.get(k);
        return { key: k, data: v ? JSON.parse(v) : null };
      })
    );

    console.log('=== Current Redis Sessions ===\n');
    sessions
      .filter((s) => s.data)
      .forEach((s) => {
        const userId = s.key.split(':')[1] || 'unknown';
        console.log(`User: ${userId.substring(0, 40)}`);
        console.log(`  Destination: ${s.data.destination?.name || 'N/A'}`);
        console.log(`  Dates: ${s.data.startDate || 'N/A'} to ${s.data.endDate || 'N/A'}`);
        console.log('');
      });
    console.log(`Total: ${sessions.filter((s) => s.data).length} session(s)`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.quit();
  }
}

checkSessions();
