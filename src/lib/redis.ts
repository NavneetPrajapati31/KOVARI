// lib/redis.ts
import { createClient } from 'redis';

// For Next.js, we need to ensure environment variables are loaded
// Next.js should automatically load .env.local, but let's add some debugging
let redisUrl = process.env.REDIS_URL;

// If REDIS_URL is not available, try to load it manually (for development)
if (!redisUrl && process.env.NODE_ENV === 'development') {
  try {
    // This is a fallback for development - Next.js should handle this automatically
    console.warn('⚠️ REDIS_URL not found, trying to load from .env.local manually');
    
    // Check if we're in a Node.js environment where we can use fs
    if (typeof require !== 'undefined') {
      try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(process.cwd(), '.env.local');
        
        if (fs.existsSync(envPath)) {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const redisUrlMatch = envContent.match(/REDIS_URL=(.+)/);
          if (redisUrlMatch) {
            redisUrl = redisUrlMatch[1].trim();
            console.log('✅ Loaded REDIS_URL from .env.local manually');
          }
        }
              } catch (fsError: any) {
          console.warn('⚠️ Could not manually load .env.local:', fsError?.message || 'Unknown error');
        }
    }
  } catch (error) {
    console.warn('⚠️ Error trying to manually load environment variables:', error);
  }
}

// Debug environment variables
console.log('🔍 Redis Configuration:');
console.log('  - REDIS_URL:', redisUrl ? '✅ Set' : '❌ Not set');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - Using URL:', redisUrl || 'redis://localhost:6380');

if (!redisUrl) {
  console.warn('⚠️ REDIS_URL not found in environment variables');
  console.warn('⚠️ Make sure you have a .env.local file with REDIS_URL');
  console.warn('⚠️ Or set REDIS_URL environment variable');
  console.warn('⚠️ Current working directory:', process.cwd());
}

const redis = createClient({
  url: redisUrl || 'redis://localhost:6380'
});

redis.on('error', (err) => {
  console.error('❌ Redis Client Error:', err);
  if (err.message.includes('ECONNREFUSED')) {
    console.error('💡 This usually means Redis is not accessible at the specified URL');
    console.error('💡 Check if your REDIS_URL is correct and Redis is running');
    if (redisUrl) {
      console.error('💡 Current REDIS_URL:', redisUrl.replace(/:[^@]*@/, ':***@'));
    }
  }
});

redis.on('connect', () => console.log('✅ Redis connected successfully'));
redis.on('ready', () => console.log('✅ Redis ready for commands'));

// Helper function to ensure Redis is connected
export async function ensureRedisConnection() {
  if (!redis.isOpen) {
    console.log('🔌 Connecting to Redis...');
    await redis.connect();
  }
  return redis;
}

export default redis;
