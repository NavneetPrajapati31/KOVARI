/**
 * Match Event Logging Schema (Day 2)
 * 
 * Defines the structure for logging match outcomes for ML training data collection.
 */

import { CompatibilityFeatures, MatchType } from "../utils/ml-types";

export type MatchOutcome =
  | "accept"
  | "chat"
  | "ignore"
  | "unmatch";

export type MatchEventLog = {
  matchType: MatchType;
  features: CompatibilityFeatures;
  outcome: MatchOutcome;
  label: 0 | 1;
  preset: string;
  timestamp: number;
  source: "rule-based";
};

/**
 * Compute binary label from match outcome (Phase 2)
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
      const _exhaustive: never = outcome;
      return 0;
  }
}
