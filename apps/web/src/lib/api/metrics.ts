import { logger } from "./logger";

/**
 * 📊 Contract Resilience Metrics
 * Tracks the health of API contracts across the system.
 */
class ContractMetrics {
  private counts = {
    clean: 0,
    filtered: 0,
    degraded: 0,
  };

  /**
   * Record a response state
   */
  record(state: 'clean' | 'filtered' | 'degraded', requestId: string) {
    this.counts[state]++;
    
    // Log periodic summary every 10 requests or on critical states
    if (state !== 'clean' || (this.counts.clean + this.counts.filtered + this.counts.degraded) % 10 === 0) {
      this.report(requestId);
    }
  }

  /**
   * Report current health snapshot to logs
   */
  private report(requestId: string) {
    const total = this.counts.clean + this.counts.filtered + this.counts.degraded;
    const healthRate = total > 0 ? ((this.counts.clean / total) * 100).toFixed(1) : "100";
    
    logger.info(requestId, "Contract Health Snapshot", {
      ...this.counts,
      total,
      healthRate: `${healthRate}%`,
      status: parseFloat(healthRate) < 80 ? "CRITICAL" : parseFloat(healthRate) < 95 ? "WARNING" : "HEALTHY"
    });
  }
}

export const contractMetrics = new ContractMetrics();
