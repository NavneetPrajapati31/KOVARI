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
 * 
 * @example
 * ```typescript
 * const raw = 200; // ❌ Type error: cannot assign to NormalizedScore
 * const normalized = createNormalizedScore(200); // ✅ Returns NormalizedScore (clamped to 1.0)
 * ```
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
] as const;

/**
 * Unified compatibility features for both solo (user-to-user) and group (user-to-group) matching.
 * 
 * Uses a single ML model with a matchType discriminator to handle both matching scenarios.
 * All features are in [0, 1] range:
 * - 0 = worst compatibility
 * - 1 = best compatibility
 * - 0.5 = neutral/missing data default
 * 
 * @example
 * ```typescript
 * // Solo matching (user-to-user)
 * const soloFeatures: CompatibilityFeatures = {
 *   matchType: 'user_user',
 *   distanceScore: 0.85,
 *   dateOverlapScore: 0.90,
 *   budgetScore: 0.75,
 *   interestScore: 0.60,
 *   ageScore: 0.80,
 *   personalityScore: 0.70,
 * };
 * 
 * // Group matching (user-to-group)
 * const groupFeatures: CompatibilityFeatures = {
 *   matchType: 'user_group',
 *   distanceScore: 0.85,
 *   dateOverlapScore: 0.90,
 *   budgetScore: 0.75,
 *   interestScore: 0.60,
 *   ageScore: 0.80,
 *   personalityScore: 0.50, // May be less relevant for groups
 *   groupSizeScore: 0.70,     // Optional group-specific feature
 *   groupDiversityScore: 0.80, // Optional group-specific feature
 * };
 * ```
 */
export type CompatibilityFeatures = {
  /**
   * Match type discriminator.
   * - 'user_user': Solo matching (user-to-user)
   * - 'user_group': Group matching (user-to-group)
   */
  matchType: MatchType;

  /**
   * Normalized distance score between destinations.
   * For solo: user destination vs match destination
   * For group: user destination vs group destination
   * Calculated from Haversine distance, normalized to [0, 1].
   * - 1.0 = same city (0-25km)
   * - 0.95 = same metro (26-50km)
   * - 0.85 = same region (51-100km)
   * - 0.75 = same state (101-150km)
   * - 0.6 = max allowed (151-200km)
   * - 0.0 = beyond 200km (hard filter, should not reach ML)
   */
  distanceScore: NormalizedScore;

  /**
   * Normalized date overlap score.
   * For solo: overlapDays / max(userTripDays, matchTripDays)
   * For group: overlapDays / userTripDays
   * Normalized to [0, 1].
   * - 1.0 = ≥80% overlap
   * - 0.9 = ≥50% overlap
   * - 0.8 = ≥30% overlap
   * - 0.6 = ≥20% overlap
   * - 0.3 = ≥10% overlap
   * - 0.1 = <10% but ≥1 day (minimum required)
   */
  dateOverlapScore: NormalizedScore;

  /**
   * Normalized budget compatibility score.
   * For solo: user budget vs match budget difference
   * For group: user budget vs group average budget difference
   * Normalized to [0, 1].
   * - 1.0 = ≤10% difference
   * - 0.8 = ≤25% difference
   * - 0.6 = ≤50% difference
   * - 0.0 = >50% difference
   */
  budgetScore: NormalizedScore;

  /**
   * Normalized interest similarity score.
   * For solo: user interests vs match interests (Jaccard similarity)
   * For group: user interests vs group top interests (Jaccard similarity)
   * Normalized to [0, 1].
   * - 1.0 = identical interests
   * - 0.5 = some overlap
   * - 0.0 = no shared interests
   */
  interestScore: NormalizedScore;

  /**
   * Normalized age compatibility score.
   * For solo: user age vs match age difference
   * For group: user age vs group average age difference
   * Normalized to [0, 1].
   * - 1.0 = same age
   * - 0.8 = ≤5 years difference
   * - 0.6 = ≤10 years difference
   * - 0.4 = ≤15 years difference
   * - 0.0 = >15 years difference
   */
  ageScore: NormalizedScore;

  /**
   * Normalized personality compatibility score.
   * More relevant for solo matching, but included for unified interface.
   * For solo: personality compatibility matrix
   * For group: may be less relevant (defaulted to 0.5 if not applicable)
   * Normalized to [0, 1].
   * - 1.0 = highly compatible (e.g., introvert + ambivert)
   * - 0.5 = neutral compatibility
   * - 0.0 = incompatible personalities
   */
  personalityScore: NormalizedScore;

  /**
   * Normalized group size score (group matching only, optional).
   * Indicates how well the group size matches user preferences.
   * Normalized to [0, 1].
   * - 1.0 = ideal group size for user
   * - 0.5 = acceptable group size
   * - 0.0 = group size not suitable
   */
  groupSizeScore?: NormalizedScore;

  /**
   * Normalized group diversity score (group matching only, optional).
   * Indicates diversity within the group (nationality, background, etc.).
   * Normalized to [0, 1].
   * - 1.0 = high diversity (desirable)
   * - 0.5 = moderate diversity
   * - 0.0 = low diversity
   */
  groupDiversityScore?: NormalizedScore;
};

/**
 * ML model prediction result for a match.
 * 
 * Both score and confidence are bounded to [0, 1] range.
 * 
 * @example
 * ```typescript
 * const result: MLMatchResult = {
 *   score: 0.87,        // High compatibility score
 *   confidence: 0.92,   // Model is very confident in this prediction
 * };
 * ```
 */
export type MLMatchResult = {
  /**
   * Final compatibility score predicted by ML model.
   * Bounded to [0, 1] range:
   * - 0.0 = no compatibility
   * - 1.0 = perfect compatibility
   * 
   * This score combines all MatchFeatures using learned weights
   * and non-linear interactions discovered by the ML model.
   */
  score: NormalizedScore;

  /**
   * Model confidence in the prediction.
   * Bounded to [0, 1] range:
   * - 1.0 = very confident (model has seen similar patterns before)
   * - 0.5 = moderate confidence
   * - 0.0 = low confidence (unusual pattern, less reliable)
   * 
   * Can be used to:
   * - Prioritize high-confidence matches
   * - Flag low-confidence matches for review
   * - Determine when to use fallback to rule-based scoring
   */
  confidence: NormalizedScore;
};

/**
 * Type guard to validate CompatibilityFeatures are in valid range [0, 1].
 * 
 * Uses exhaustive key checking to protect against schema drift.
 * Validates required fields and optional group-specific fields if present.
 * 
 * @param features - Features to validate
 * @returns true if all required features are in [0, 1] range
 */
export function isValidCompatibilityFeatures(features: CompatibilityFeatures): boolean {
  // Validate discriminator first
  if (features.matchType !== 'user_user' && features.matchType !== 'user_group') {
    return false;
  }

  // Disallow group-only fields on solo match to keep datasets clean
  if (features.matchType === 'user_user') {
    if (features.groupSizeScore !== undefined || features.groupDiversityScore !== undefined) {
      return false;
    }
  }

  // Validate required numeric fields
  const numericValid = REQUIRED_NUMERIC_KEYS.every((key) => {
    const value = features[key];
    return typeof value === 'number' && value >= 0 && value <= 1;
  });

  if (!numericValid) return false;

  // Validate optional group-specific fields if present
  if (features.groupSizeScore !== undefined) {
    if (typeof features.groupSizeScore !== 'number' || 
        features.groupSizeScore < 0 || 
        features.groupSizeScore > 1) {
      return false;
    }
  }

  if (features.groupDiversityScore !== undefined) {
    if (typeof features.groupDiversityScore !== 'number' || 
        features.groupDiversityScore < 0 || 
        features.groupDiversityScore > 1) {
      return false;
    }
  }

  return true;
}

/**
 * Counts how many features are active (not neutral) for logging/monitoring.
 * Useful for detecting weak feature vectors and cold-start behavior.
 */
export function countActiveFeatures(features: CompatibilityFeatures): number {
  return Object.values(features).filter(
    (v) => typeof v === 'number' && v !== NEUTRAL_SCORE
  ).length;
}

/**
 * Type guard to validate MLMatchResult is in valid range [0, 1].
 * 
 * @param result - ML result to validate
 * @returns true if score and confidence are in [0, 1] range
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
 * Clamps values outside range to 0 or 1.
 * 
 * @param value - Value to normalize
 * @param min - Minimum expected value (for scaling)
 * @param max - Maximum expected value (for scaling)
 * @returns Normalized value in [0, 1] range as NormalizedScore
 */
export function normalizeFeature(value: number, min: number, max: number): NormalizedScore {
  if (max === min) return NEUTRAL_SCORE; // Avoid division by zero
  const normalized = (value - min) / (max - min);
  return Math.max(0, Math.min(1, normalized)) as NormalizedScore; // Clamp to [0, 1]
}

/**
 * Coerces partial features to fully normalized CompatibilityFeatures.
 * Replaces any invalid or missing values with NEUTRAL_SCORE.
 * 
 * This function ensures type safety by converting raw or partial data
 * into properly normalized, branded types. Handles both solo and group matching
 * based on the matchType discriminator.
 * 
 * @param features - Partial features to coerce (may contain raw numbers or missing values)
 * @returns Fully normalized CompatibilityFeatures with all values in [0, 1]
 * 
 * @example
 * ```typescript
 * // Solo matching
 * const soloRaw = extractSoloFeatures(...);
 * const soloFeatures = coerceCompatibilityFeaturesToNormalized({
 *   matchType: 'user_user',
 *   ...soloRaw,
 * });
 * 
 * // Group matching
 * const groupRaw = extractGroupFeatures(...);
 * const groupFeatures = coerceCompatibilityFeaturesToNormalized({
 *   matchType: 'user_group',
 *   ...groupRaw,
 * });
 * ```
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
  };

  // Add optional group-specific features if matchType is 'user_group'
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
 * Clamps invalid values to [0, 1] and uses NEUTRAL_SCORE for missing values.
 * 
 * @param result - Result to sanitize
 * @returns Sanitized result with all values in [0, 1]
 */
export function sanitizeMLMatchResult(result: Partial<MLMatchResult>): MLMatchResult {
  return {
    score: clampToRange(result.score ?? NEUTRAL_SCORE),
    confidence: clampToRange(result.confidence ?? NEUTRAL_SCORE),
  };
}

/**
 * Creates a NormalizedScore from a raw number.
 * 
 * This is the primary way to create NormalizedScore values from raw numbers.
 * Invalid values (NaN, non-numbers) default to NEUTRAL_SCORE.
 * 
 * @param value - Value to normalize (may be raw number or already NormalizedScore)
 * @returns Value clamped to [0, 1] as NormalizedScore
 * 
 * @example
 * ```typescript
 * const raw = 200; // ❌ Type error: cannot assign to NormalizedScore
 * const normalized = createNormalizedScore(200); // ✅ Returns 1.0 as NormalizedScore
 * ```
 */
export function createNormalizedScore(value: number): NormalizedScore {
  return clampToRange(value);
}

/**
 * Clamps a number to [0, 1] range and returns as NormalizedScore.
 * 
 * This is the internal implementation used by all normalization functions.
 * Invalid values (NaN, non-numbers) default to NEUTRAL_SCORE.
 * 
 * @param value - Value to clamp (may be raw number or already NormalizedScore)
 * @returns Value clamped to [0, 1] as NormalizedScore
 */
function clampToRange(value: number): NormalizedScore {
  if (typeof value !== 'number' || isNaN(value)) {
    return NEUTRAL_SCORE; // Default to neutral for invalid values
  }
  return Math.max(0, Math.min(1, value)) as NormalizedScore;
}

