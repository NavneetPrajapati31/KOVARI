/**
 * Match Event Logger (Day 2)
 * 
 * Logs match events for ML training data collection.
 */

import { MatchEventLog, MatchOutcome, computeLabel } from "./match-event";

/**
 * Create a complete match event log with computed label
 */
export function createMatchEventLog(
  matchType: MatchEventLog["matchType"],
  features: MatchEventLog["features"],
  outcome: MatchOutcome,
  preset: string
): MatchEventLog {
  return {
    matchType,
    features,
    outcome,
    label: computeLabel(outcome),
    preset,
    timestamp: Date.now(),
    source: "rule-based",
  };
}

/**
 * Log a match event
 */
export function logMatchEvent(event: MatchEventLog) {
  console.log(
    "[ML_MATCH_EVENT]",
    JSON.stringify(event)
  );
}
