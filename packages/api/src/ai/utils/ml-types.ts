/**
 * ML Types for KOVARI Matching Algorithm
 *
 * IMPORTANT:
 * This file MUST NOT contain any scoring logic, weights, or thresholds.
 * It defines feature contracts, branding, normalization, and validation only.
 * All scoring decisions are handled by the ML model.
 *
 * This file defines the data contracts for ML-enhanced matching.
 * All features are normalized to [0, 1] range to ensure consistent ML input.
 * All outputs are bounded to [0, 1] range for predictable behavior.
 *
 * **Architecture:** Single ML model with unified feature interface.
 * Uses `matchType` discriminator ('user_user' | 'user_group') to handle
 * both solo and group matching scenarios with slightly different feature aggregation.
 *
 * @module ml-types
 */

/**
 * Branded type for normalized scores in [0, 1] range.
 * 
 * This prevents accidental use of raw values that haven't been normalized.
 * Only values explicitly cast to NormalizedScore or returned from normalization
 * functions can be assigned to fields requiring this type.
 */
export type NormalizedScore = number & { readonly __brand: 'NormalizedScore' };

/**
 * Single source of truth for neutral/default score value.
 * Used when data is missing or invalid.
 */
export const NEUTRAL_SCORE = 0.5 as NormalizedScore;

/**
 * Match type discriminator for unified compatibility features.
 */
export type MatchType = 'user_user' | 'user_group';

/**
 * Required numeric keys for CompatibilityFeatures validation.
 * Ensures exhaustive checking and protects against schema drift.
 */
const REQUIRED_NUMERIC_KEYS: (keyof Omit<CompatibilityFeatures, 'matchType'>)[] = [
  'distanceScore',
  'dateOverlapScore',
  'budgetScore',
  'interestScore',
  'ageScore',
  'personalityScore',
  'destination_interest',
  'date_budget',
] as const;

/**
 * Unified compatibility features for both solo (user-to-user) and group (user-to-group) matching.
 */
export type CompatibilityFeatures = {
  matchType: MatchType;
  distanceScore: NormalizedScore;
  dateOverlapScore: NormalizedScore;
  budgetScore: NormalizedScore;
  interestScore: NormalizedScore;
  ageScore: NormalizedScore;
  personalityScore: NormalizedScore;
  destination_interest: NormalizedScore;
  date_budget: NormalizedScore;
  groupSizeScore?: NormalizedScore;
  groupDiversityScore?: NormalizedScore;
};

/**
 * ML model prediction result for a match.
 */
export type MLMatchResult = {
  score: NormalizedScore;
  confidence: NormalizedScore;
};

/**
 * Type guard to validate CompatibilityFeatures are in valid range [0, 1].
 */
export function isValidCompatibilityFeatures(features: CompatibilityFeatures): boolean {
  if (features.matchType !== 'user_user' && features.matchType !== 'user_group') {
    return false;
  }

  if (features.matchType === 'user_user') {
    if (features.groupSizeScore !== undefined || features.groupDiversityScore !== undefined) {
      return false;
    }
  }

  const numericValid = REQUIRED_NUMERIC_KEYS.every((key) => {
    const value = features[key];
    return typeof value === 'number' && value >= 0 && value <= 1;
  });

  if (!numericValid) return false;

  if (features.groupSizeScore !== undefined) {
    if (typeof features.groupSizeScore !== 'number' || features.groupSizeScore < 0 || features.groupSizeScore > 1) {
      return false;
    }
  }

  if (features.groupDiversityScore !== undefined) {
    if (typeof features.groupDiversityScore !== 'number' || features.groupDiversityScore < 0 || features.groupDiversityScore > 1) {
      return false;
    }
  }

  return true;
}

/**
 * Counts how many features are active (not neutral) for logging/monitoring.
 */
export function countActiveFeatures(features: CompatibilityFeatures): number {
  return Object.values(features).filter(
    (v) => typeof v === 'number' && v !== NEUTRAL_SCORE
  ).length;
}

/**
 * Type guard to validate MLMatchResult is in valid range [0, 1].
 */
export function isValidMLMatchResult(result: MLMatchResult): boolean {
  return (
    typeof result.score === 'number' &&
    result.score >= 0 &&
    result.score <= 1 &&
    typeof result.confidence === 'number' &&
    result.confidence >= 0 &&
    result.confidence <= 1
  );
}

/**
 * Normalizes a feature value to [0, 1] range.
 */
export function normalizeFeature(value: number, min: number, max: number): NormalizedScore {
  if (max === min) return NEUTRAL_SCORE;
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized)) as NormalizedScore;
}

/**
 * Coerces partial features to fully normalized CompatibilityFeatures.
 */
export function coerceCompatibilityFeaturesToNormalized(
  features: Partial<CompatibilityFeatures> & { matchType: MatchType }
): CompatibilityFeatures {
  const base: CompatibilityFeatures = {
    matchType: features.matchType,
    distanceScore: clampToRange(features.distanceScore ?? NEUTRAL_SCORE),
    dateOverlapScore: clampToRange(features.dateOverlapScore ?? NEUTRAL_SCORE),
    budgetScore: clampToRange(features.budgetScore ?? NEUTRAL_SCORE),
    interestScore: clampToRange(features.interestScore ?? NEUTRAL_SCORE),
    ageScore: clampToRange(features.ageScore ?? NEUTRAL_SCORE),
    personalityScore: clampToRange(features.personalityScore ?? NEUTRAL_SCORE),
    destination_interest: clampToRange(
      features.destination_interest ?? 
      (clampToRange(features.distanceScore ?? NEUTRAL_SCORE) * clampToRange(features.interestScore ?? NEUTRAL_SCORE))
    ),
    date_budget: clampToRange(
      features.date_budget ?? 
      (clampToRange(features.dateOverlapScore ?? NEUTRAL_SCORE) * clampToRange(features.budgetScore ?? NEUTRAL_SCORE))
    ),
  };

  if (features.matchType === 'user_group') {
    if (features.groupSizeScore !== undefined) {
      base.groupSizeScore = clampToRange(features.groupSizeScore);
    }
    if (features.groupDiversityScore !== undefined) {
      base.groupDiversityScore = clampToRange(features.groupDiversityScore);
    }
  }

  return base;
}

/**
 * Ensures MLMatchResult values are in valid range.
 */
export function sanitizeMLMatchResult(result: Partial<MLMatchResult>): MLMatchResult {
  return {
    score: clampToRange(result.score ?? NEUTRAL_SCORE),
    confidence: clampToRange(result.confidence ?? NEUTRAL_SCORE),
  };
}

/**
 * Creates a NormalizedScore from a raw number.
 */
export function createNormalizedScore(value: number): NormalizedScore {
  return clampToRange(value);
}

/**
 * Clamps a number to [0, 1] range and returns as NormalizedScore.
 */
function clampToRange(value: number): NormalizedScore {
  if (typeof value !== 'number' || isNaN(value)) {
    return NEUTRAL_SCORE;
  }
  return Math.max(0, Math.min(1, value)) as NormalizedScore;
}
