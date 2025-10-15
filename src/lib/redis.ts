// lib/redis.ts
import { createClient } from 'redis';

const redis = createClient();

redis.on('error', (err) => console.error('❌ Redis Client Error:', err));

(async () => {
  if (!redis.isOpen) await redis.connect();
})();

export default redis;
