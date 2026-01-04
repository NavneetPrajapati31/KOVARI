/**
 * Match Event Logging Schema (Day 2)
 * 
 * Defines the structure for logging match outcomes for ML training data collection.
 * This is the single source of truth for data collection.
 */

import { CompatibilityFeatures, MatchType } from "../utils/ml-types";

export type MatchOutcome =
  | "accept"
  | "chat"
  | "ignore"
  | "unmatch";

export type MatchEventLog = {
  matchType: MatchType;              // 'user_user' | 'user_group'
  features: CompatibilityFeatures;   // output of Day-1 extractor
  outcome: MatchOutcome;              // final observed behavior
  label: 0 | 1;                      // binary label for ML training (Phase 2)
  preset: string;                     // e.g. 'balanced'
  timestamp: number;                  // Date.now()
  source: "rule-based";               // IMPORTANT: ML not active yet
};

/**
 * Compute binary label from match outcome (Phase 2)
 * 
 * Label Logic v1 (LOCKED):
 * - accept → 1 (positive: user engaged)
 * - chat → 1 (positive: user engaged)
 * - ignore → 0 (negative: user disengaged)
 * - unmatch → 0 (negative: user disengaged)
 * 
 * Rationale:
 * - Optimizes for engagement
 * - Matches success metrics
 * - Easy to explain
 * - Easy to extend later
 */
export function computeLabel(outcome: MatchOutcome): 0 | 1 {
  switch (outcome) {
    case "accept":
    case "chat":
      return 1;
    case "ignore":
    case "unmatch":
      return 0;
    default:
      // TypeScript exhaustiveness check - should never reach here
      const _exhaustive: never = outcome;
      return 0;
  }
}

