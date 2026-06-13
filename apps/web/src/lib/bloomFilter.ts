import { ensureRedisConnection, createAdminSupabaseClient } from "@kovari/api";
import { clerkClient } from "@clerk/nextjs/server";

const BIT_SIZE = 1000000; // 1 million bits (~125 KB)
const HASH_SEEDS = [2166136261, 3754064501, 16777619, 2862933555, 3381643289];

function fnv1a(str: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % BIT_SIZE;
}

export function getBitIndices(username: string): number[] {
  const normalized = username.toLowerCase().trim();
  return HASH_SEEDS.map((seed) => fnv1a(normalized, seed));
}

let initPromise: Promise<void> | null = null;

export async function initializeBloomFilter(): Promise<void> {
  const redisClient = await ensureRedisConnection();
  
  // 1. Double check Redis first
  const initialized = await redisClient.get("usernames:bloom:initialized");
  if (initialized === "true") return;

  if (initPromise) {
    return initPromise;
  }

  initPromise = (async () => {
    const initializedRetry = await redisClient.get("usernames:bloom:initialized");
    if (initializedRetry === "true") return;

    console.log("[BloomFilter] Initializing Bloom filter bitmap from Database and Clerk...");
    const supabaseAdmin = createAdminSupabaseClient();
    
    // Fetch all usernames from Supabase profiles
    let allUsernames: string[] = [];
    let hasMore = true;
    let offset = 0;
    const limit = 1000;
    
    while (hasMore) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .select("username")
        .range(offset, offset + limit - 1);
        
      if (error) {
        console.error("[BloomFilter] Error fetching profiles for Bloom filter:", error);
        break;
      }
      
      if (data && data.length > 0) {
        allUsernames = allUsernames.concat(data.map((p) => p.username).filter(Boolean));
        offset += limit;
      } else {
        hasMore = false;
      }
    }
    
    // Fetch from Clerk
    try {
      const client = await clerkClient();
      let clerkHasMore = true;
      let nextToken: string | undefined = undefined;
      
      while (clerkHasMore) {
        const list = await client.users.getUserList({
          limit: 500,
          ...(nextToken ? { queryToken: nextToken } : {})
        });
        
        if (list.data && list.data.length > 0) {
          list.data.forEach((u) => {
            if (u.username) allUsernames.push(u.username);
          });
          if (list.data.length < 500) {
            clerkHasMore = false;
          } else {
            clerkHasMore = false; 
          }
        } else {
          clerkHasMore = false;
        }
      }
    } catch (e) {
      console.error("[BloomFilter] Error fetching Clerk users for Bloom filter:", e);
    }
    
    // De-duplicate usernames
    const uniqueUsernames = Array.from(
      new Set(allUsernames.map((u) => u.toLowerCase().trim()))
    );
    
    // Set bits in Redis for all usernames
    for (const username of uniqueUsernames) {
      const indices = getBitIndices(username);
      await Promise.all(
        indices.map((index) => redisClient.setBit("usernames:bloom", index, 1))
      );
    }
    
    await redisClient.set("usernames:bloom:initialized", "true");
    console.log(`[BloomFilter] Successfully populated Bloom filter with ${uniqueUsernames.length} usernames.`);
  })();

  try {
    await initPromise;
  } finally {
    initPromise = null;
  }
}

export async function existsInFilter(username: string): Promise<boolean> {
  await initializeBloomFilter();
  
  const redisClient = await ensureRedisConnection();
  const indices = getBitIndices(username);
  
  const bits = await Promise.all(
    indices.map((index) => redisClient.getBit("usernames:bloom", index))
  );
  
  return bits.every((bit) => bit === 1);
}

export async function addToFilter(username: string): Promise<void> {
  await initializeBloomFilter();
  
  const redisClient = await ensureRedisConnection();
  const indices = getBitIndices(username);
  
  await Promise.all(
    indices.map((index) => redisClient.setBit("usernames:bloom", index, 1))
  );
}
