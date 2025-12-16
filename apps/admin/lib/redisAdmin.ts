// apps/admin/lib/redisAdmin.ts
import { createClient } from 'redis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not set');
}

// Simple singleton
let client: ReturnType<typeof createClient> | null = null;

export function getRedisAdminClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL,
    });
    client.on('error', (err) => {
      console.error('Redis error (admin):', err);
    });
    // Don't auto-connect during build time
    // NEXT_PHASE is set by Next.js during build phases
    const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
    if (!isBuildPhase) {
      client.connect().catch((err) => {
        console.error('Failed to connect Redis (admin):', err);
      });
    }
  }
  return client;
}

// Default export - the client itself
// Connection is deferred during build phase (see getRedisAdminClient above)
export default getRedisAdminClient();

// Helper function to ensure Redis is connected
export async function ensureRedisConnection() {
  const redisClient = getRedisAdminClient();
  if (!redisClient.isOpen) {
    console.log('🔌 Connecting to Redis (admin)...');
    await redisClient.connect();
  }
  return redisClient;
}

// Parse session value from Redis (handles JSON strings, null, and invalid JSON)
export function parseSessionValue(raw: string | null): unknown {
  if (raw === null) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
