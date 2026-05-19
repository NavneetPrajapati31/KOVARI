import { pubClient } from "./redis";

/**
 * Handles authoritative sequence increments with an in-memory fallback
 * when Redis is unavailable.
 */
class SequenceManager {
  private inMemorySequences: Map<string, number> = new Map();

  async getNext(key: string): Promise<number> {
    if (pubClient.isOpen) {
      try {
        return await pubClient.incr(key);
      } catch (err) {
        console.error(`[SequenceManager] Redis incr failed for ${key}:`, err);
        // Fall through to memory
      }
    }

    const current = this.inMemorySequences.get(key) || 0;
    const next = current + 1;
    this.inMemorySequences.set(key, next);
    return next;
  }
}

export const sequenceManager = new SequenceManager();
