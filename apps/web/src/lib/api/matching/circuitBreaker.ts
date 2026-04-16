import { redis } from "@kovari/api";
import { logger } from "@/lib/api/logger";

const FALLBACK_THRESHOLD = 5;
const COOLDOWN_SECONDS = 60;

export type CircuitState = "OPEN" | "CLOSED" | "HALF-OPEN";

const REDIS_TIMEOUT = 100;

/**
 * Distributed Circuit Breaker to protect upstream services
 */
export class RedisCircuitBreaker {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  private get keys() {
    return {
      failures: `cb:${this.serviceName}:failures`,
      state: `cb:${this.serviceName}:state`,
      lock: `lock:cb:${this.serviceName}:half-open`,
    };
  }

  async getState(): Promise<{ state: CircuitState; failures: number }> {
    try {
      const [state, failures] = await Promise.all([
        Promise.race([
          redis.get(this.keys.state),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Redis Timeout")), REDIS_TIMEOUT))
        ]),
        Promise.race([
          redis.get(this.keys.failures),
          new Promise<null>((_, reject) => setTimeout(() => reject(new Error("Redis Timeout")), REDIS_TIMEOUT))
        ])
      ]);

      return {
        state: (state as CircuitState) || "CLOSED",
        failures: parseInt(failures || "0", 10)
      };
    } catch {
      return { state: "CLOSED", failures: 0 };
    }
  }

  async recordFailure() {
    try {
      const failures = await redis.incr(this.keys.failures);
      if (failures >= FALLBACK_THRESHOLD) {
        await redis.set(this.keys.state, "OPEN", { EX: COOLDOWN_SECONDS });
      }
    } catch (err: any) {
      // SILENT FAIL in production to keep logs clean
      logger.debug(this.keys.failures, { error: "CB Record Failure Error", message: err.message });
    }
  }

  async recordSuccess() {
    try {
      await Promise.all([
        redis.del(this.keys.failures),
        redis.set(this.keys.state, "CLOSED")
      ]);
    } catch (err: any) {
      // SILENT FAIL in production
      logger.debug(this.keys.failures, { error: "CB Record Success Error", message: err.message });
    }
  }

  /**
   * Check if we should allow a request (supports HALF-OPEN logic)
   */
  async shouldAllowRequest(): Promise<boolean> {
    const { state } = await this.getState();
    
    if (state === "CLOSED") return true;
    
    // If OPEN, check if we can transition to HALF-OPEN (Atomic test)
    if (state === "OPEN") {
      const lockKey = this.keys.lock;
      const isTestLocked = await redis.set(lockKey, "1", { NX: true, EX: 5 });
      
      if (isTestLocked === "OK") {
        // We are the lucky instance that gets to test the recovery
        return true; 
      }
      return false; // Stay in fallback for everyone else
    }

    return false;
  }
}

export const matchingServiceBreaker = new RedisCircuitBreaker("go-matching");
