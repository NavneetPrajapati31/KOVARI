/**
 * Match Event Logger (Day 2)
 * 
 * Logs match events for ML training data collection.
 * v1: simple append-only JSONL via console.log
 * Later: DB / analytics pipeline
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
 * Log a match event (Phase 1 + Phase 2)
 * 
 * Automatically computes binary label from outcome.
 */
export function logMatchEvent(event: MatchEventLog) {
  // v1: simple append-only JSONL
  // Later: DB / analytics pipeline

  console.log(
    "[ML_MATCH_EVENT]",
    JSON.stringify(event)
  );
}

