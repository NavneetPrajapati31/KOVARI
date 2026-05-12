/**
 * Simple in-memory Set storage for local development when Redis is down.
 */
class MemorySets {
  private sets: Map<string, Set<string>> = new Map();

  async sAdd(key: string, value: string): Promise<void> {
    if (!this.sets.has(key)) {
      this.sets.set(key, new Set());
    }
    this.sets.get(key)!.add(value);
  }

  async sRem(key: string, value: string): Promise<void> {
    this.sets.get(key)?.delete(value);
  }

  async sCard(key: string): Promise<number> {
    return this.sets.get(key)?.size || 0;
  }

  async sMembers(key: string): Promise<string[]> {
    return Array.from(this.sets.get(key) || []);
  }

  async del(key: string): Promise<void> {
    this.sets.delete(key);
  }
  
  async getKeys(pattern: string): Promise<string[]> {
      const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
      return Array.from(this.sets.keys()).filter(k => regex.test(k));
  }
}

export const memorySets = new MemorySets();

/**
 * Simple in-memory Key-Value storage fallback.
 */
class MemoryKV {
    private store: Map<string, string> = new Map();
    
    async set(key: string, value: string): Promise<void> {
        this.store.set(key, value);
    }
    
    async get(key: string): Promise<string | null> {
        return this.store.get(key) || null;
    }
}

export const memoryKV = new MemoryKV();
