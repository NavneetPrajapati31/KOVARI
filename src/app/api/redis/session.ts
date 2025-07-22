// api/redis/session.ts
import redis from '@/lib/redis';

const TTL_SECONDS = 3600; // 1 hour

export async function storeSessionPreference(userId: string, preference: any) {
  const key = `session:user:${userId}`;
  const value = JSON.stringify({
    ...preference,
    timestamp: Math.floor(Date.now() / 1000),
  });

  await redis.set(key, value);
  await redis.expire(key, TTL_SECONDS);
}

export async function getSessionPreference(userId: string) {
  const key = `session:user:${userId}`;
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

export async function getAllActiveSessions() {
  const keys = await redis.keys('session:user:*');
  const sessions = await Promise.all(
    keys.map(async (key) => {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    })
  );
  return sessions.filter(Boolean);
}
