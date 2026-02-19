/**
 * Compatibility feature extraction (Day 1)
 *
 * IMPORTANT:
 * - Only computes normalized features (no weights, no sums, no final scores).
 * - Assumes hard filters (distance cap, date overlap >=1 day, valid coords/dates)
 *   are enforced BEFORE calling this extractor.
 */

import {
  CompatibilityFeatures,
  MatchType,
  NEUTRAL_SCORE,
  NormalizedScore,
  coerceCompatibilityFeaturesToNormalized,
} from "../utils/ml-types.ts";

type LatLon = { lat: number; lon: number };

type SoloLike = {
  destination?: LatLon;
  startDate?: string;
  endDate?: string;
  budget?: number;
  static_attributes?: {
    age?: number;
    interests?: string[];
    personality?: string;
    location?: LatLon;
    smoking?: string;
    drinking?: string;
    religion?: string;
  };
};

type GroupLike = {
  destination?: LatLon;
  startDate?: string;
  endDate?: string;
  averageBudget?: number;
  averageAge?: number;
  topInterests?: string[];
  dominantLanguages?: string[];
  smokingPolicy?: string;
  drinkingPolicy?: string;
  dominantNationalities?: string[];
  size?: number; // optional, if available
};

const EARTH_RADIUS_KM = 6371;

const clamp01 = (value: number): NormalizedScore =>
  Math.max(0, Math.min(1, value)) as NormalizedScore;

const parseDate = (d?: string): number => (d ? new Date(d).getTime() : NaN);

const haversineKm = (a?: LatLon, b?: LatLon): number => {
  if (!a || !b) return Infinity;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return EARTH_RADIUS_KM * c;
};

const distanceScore = (a?: LatLon, b?: LatLon): NormalizedScore => {
  const d = haversineKm(a, b);
  if (!isFinite(d)) return NEUTRAL_SCORE;
  if (d === 0) return 1.0 as NormalizedScore;
  if (d <= 25) return 1.0 as NormalizedScore;
  if (d <= 50) return 0.95 as NormalizedScore;
  if (d <= 100) return 0.85 as NormalizedScore;
  if (d <= 150) return 0.75 as NormalizedScore;
  if (d <= 200) return 0.6 as NormalizedScore;
  return 0 as NormalizedScore; // beyond hard filter
};

const dateOverlapScore = (
  startA?: string,
  endA?: string,
  startB?: string,
  endB?: string,
  matchType: MatchType = "user_user"
): NormalizedScore => {
  const sA = parseDate(startA);
  const eA = parseDate(endA);
  const sB = parseDate(startB);
  const eB = parseDate(endB);
  if ([sA, eA, sB, eB].some((v) => isNaN(v))) return 0 as NormalizedScore;

  const overlapStart = Math.max(sA, sB);
  const overlapEnd = Math.min(eA, eB);
  const overlapMs = Math.max(0, overlapEnd - overlapStart);
  const overlapDays = overlapMs / (1000 * 60 * 60 * 24);
  if (overlapDays < 1) return 0 as NormalizedScore; // hard gate assumption

  const denom =
    matchType === "user_group"
      ? eA - sA
      : Math.max(eA - sA, eB - sB); // solo uses max trip duration
  if (denom <= 0) return 0 as NormalizedScore;

  const ratio = overlapDays / (denom / (1000 * 60 * 60 * 24));
  if (ratio >= 0.8) return 1.0 as NormalizedScore;
  if (ratio >= 0.5) return 0.9 as NormalizedScore;
  if (ratio >= 0.3) return 0.8 as NormalizedScore;
  if (ratio >= 0.2) return 0.6 as NormalizedScore;
  if (ratio >= 0.1) return 0.3 as NormalizedScore;
  return 0.1 as NormalizedScore;
};

const budgetScore = (
  a?: number,
  b?: number,
  matchType: MatchType = "user_user"
): NormalizedScore => {
  if (a === undefined || b === undefined) return NEUTRAL_SCORE;

  // Solo: relative ratio tiers (matches solo.ts intent)
  if (matchType === "user_user") {
    const maxBudget = Math.max(a, b);
    if (maxBudget === 0) return 1.0 as NormalizedScore;
    const ratio = Math.abs(a - b) / maxBudget;
    if (ratio <= 0.1) return 1.0 as NormalizedScore;
    if (ratio <= 0.25) return 0.8 as NormalizedScore;
    if (ratio <= 0.5) return 0.6 as NormalizedScore;
    if (ratio <= 1.0) return 0.4 as NormalizedScore;
    if (ratio <= 2.0) return 0.2 as NormalizedScore;
    return 0.1 as NormalizedScore;
  }

  // Group: original group.ts logic (1 - |diff|/40000) clamped to [0,1]
  const diff = Math.abs(a - b);
  const score = 1 - diff / 40000;
  return clamp01(score);
};

const jaccard = (a?: string[], b?: string[], addBonus = false): NormalizedScore => {
  if (!a || !b || a.length === 0 || b.length === 0) return NEUTRAL_SCORE;
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  if (union.size === 0) return 0.5 as NormalizedScore;
  let score = intersection.size / union.size;
  if (addBonus && intersection.size > 0) {
    score = Math.min(1.0, score + 0.2);
  }
  return clamp01(score);
};

const ageScore = (a?: number, b?: number): NormalizedScore => {
  if (a === undefined || b === undefined) return NEUTRAL_SCORE;
  const diff = Math.abs(a - b);
  if (diff <= 2) return 1.0 as NormalizedScore;
  if (diff <= 5) return 0.9 as NormalizedScore;
  if (diff <= 10) return 0.7 as NormalizedScore;
  if (diff <= 15) return 0.5 as NormalizedScore;
  if (diff <= 25) return 0.3 as NormalizedScore;
  if (diff <= 40) return 0.1 as NormalizedScore;
  return 0.05 as NormalizedScore;
};

const personalityScore = (p1?: string, p2?: string): NormalizedScore => {
  if (!p1 || !p2) return 0.5 as NormalizedScore;
  const map: Record<string, Record<string, number>> = {
    introvert: { introvert: 1.0, ambivert: 0.7, extrovert: 0.4 },
    ambivert: { introvert: 0.7, ambivert: 1.0, extrovert: 0.7 },
    extrovert: { introvert: 0.4, ambivert: 0.7, extrovert: 1.0 },
  };
  return clamp01(map[p1]?.[p2] ?? 0);
};

const groupSizeScore = (size?: number): NormalizedScore => {
  if (size === undefined || size <= 0) return NEUTRAL_SCORE;
  // Example heuristic: ideal small/medium groups
  if (size <= 6) return 1.0 as NormalizedScore;
  if (size <= 12) return 0.8 as NormalizedScore;
  if (size <= 20) return 0.6 as NormalizedScore;
  if (size <= 40) return 0.4 as NormalizedScore;
  return 0.2 as NormalizedScore;
};

const groupDiversityScore = (languages?: string[], nationalities?: string[]): NormalizedScore => {
  const langScore = languages ? clamp01(languages.length >= 3 ? 1 : languages.length === 2 ? 0.7 : 0.5) : NEUTRAL_SCORE;
  const nationalityScore = nationalities
    ? clamp01(nationalities.length >= 3 ? 1 : nationalities.length === 2 ? 0.7 : 0.5)
    : NEUTRAL_SCORE;
  return clamp01((langScore + nationalityScore) / 2);
};

export function extractCompatibilityFeatures(
  matchType: MatchType,
  user: SoloLike,
  target: SoloLike | GroupLike
): CompatibilityFeatures {
  const isGroup = matchType === "user_group";

  const distance = distanceScore(user.destination, target.destination);
  const dateOverlap = dateOverlapScore(
    user.startDate,
    user.endDate,
    target.startDate,
    target.endDate,
    matchType
  );
  const budget = budgetScore(
    user.budget,
    isGroup ? (target as GroupLike).averageBudget : (target as SoloLike).budget,
    matchType
  );
  const interests = jaccard(
    user.static_attributes?.interests,
    isGroup ? (target as GroupLike).topInterests : (target as SoloLike).static_attributes?.interests,
    !isGroup // bonus only for solo
  );
  const age = ageScore(
    user.static_attributes?.age,
    isGroup ? (target as GroupLike).averageAge : (target as SoloLike).static_attributes?.age
  );
  const personality =
    isGroup ? NEUTRAL_SCORE : personalityScore(
      user.static_attributes?.personality,
      (target as SoloLike).static_attributes?.personality
    );

  // Calculate interaction features (nonlinear combinations)
  // These will be properly normalized in coerceCompatibilityFeaturesToNormalized
  const destination_interest = distance * interests;
  const date_budget = dateOverlap * budget;

  const raw: Partial<CompatibilityFeatures> & { matchType: MatchType } = {
    matchType,
    distanceScore: distance,
    dateOverlapScore: dateOverlap,
    budgetScore: budget,
    interestScore: interests,
    ageScore: age,
    personalityScore: personality,
    destination_interest: destination_interest as any,  // Will be normalized in coerce function
    date_budget: date_budget as any,                    // Will be normalized in coerce function
  };

  if (isGroup) {
    const g = target as GroupLike;
    raw.groupSizeScore = groupSizeScore(g.size);
    raw.groupDiversityScore = groupDiversityScore(g.dominantLanguages, g.dominantNationalities);
  }

  // Final safety: normalize and clamp everything to [0,1]
  return coerceCompatibilityFeaturesToNormalized(raw);
}

