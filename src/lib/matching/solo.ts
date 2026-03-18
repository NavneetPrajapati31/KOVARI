import { SoloSession, StaticAttributes } from "../../types";

// --- 1. DATA TYPE DEFINITIONS ---

export interface FilterBoost {
  age?: { min: number; max: number; boost: number };
  gender?: { value: string; boost: number };
  personality?: { value: string; boost: number };
  interests?: { values: string[]; boost: number };
  religion?: { value: string; boost: number };
  smoking?: { value: string; boost: number };
  drinking?: { value: string; boost: number };
}

// --- 2. HELPER & SCORING FUNCTIONS ---

export const getHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  if (
    typeof lat1 !== "number" ||
    typeof lon1 !== "number" ||
    typeof lat2 !== "number" ||
    typeof lon2 !== "number"
  ) {
    return Infinity;
  }
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const calculateDestinationScore = (
  dest1?: { lat: number; lon: number },
  dest2?: { lat: number; lon: number },
  maxDistanceKm: number = 200
): number => {
  if (!dest1 || !dest2) return 0.3;
  const distance = getHaversineDistance(dest1.lat, dest1.lon, dest2.lat, dest2.lon);
  if (distance <= 10) return 1.0;
  return Math.max(0, 1 - distance / maxDistanceKm);
};

export const calculateDateOverlapScore = (
  start1: string,
  end1: string,
  start2: string,
  end2: string
): number => {
  const s1 = new Date(start1).getTime();
  const e1 = new Date(end1).getTime();
  const s2 = new Date(start2).getTime();
  const e2 = new Date(end2).getTime();

  if (isNaN(s1) || isNaN(e1) || isNaN(s2) || isNaN(e2)) return 0;

  const overlapStart = Math.max(s1, s2);
  const overlapEnd = Math.min(e1, e2);
  const overlapDays = Math.max(0, (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24));

  if (overlapDays < 1) return 0;

  const tripDuration = (e1 - s1) / (1000 * 60 * 60 * 24);
  if (tripDuration <= 0) return 0;

  const ratio = overlapDays / tripDuration;
  if (ratio >= 0.8) return 1.0;
  if (ratio >= 0.5) return 0.9;
  if (ratio >= 0.3) return 0.8;
  if (ratio >= 0.2) return 0.6;
  return 0.3;
};

export const calculateJaccardSimilarity = (
  set1?: string[],
  set2?: string[]
): number => {
  if (!set1 || !set2 || set1.length === 0 || set2.length === 0) return 0.5;
  const s1 = new Set(set1.map(v => v.toLowerCase().trim()));
  const s2 = new Set(set2.map(v => v.toLowerCase().trim()));
  const intersection = [...s1].filter(x => s2.has(x)).length;
  const union = new Set([...s1, ...s2]).size;
  return union === 0 ? 0.5 : intersection / union;
};

export const getPersonalityCompatibility = (p1?: string, p2?: string): number => {
  if (!p1 || !p2) return 0.5;
  const map: Record<string, Record<string, number>> = {
    introvert: { introvert: 1.0, ambivert: 0.7, extrovert: 0.4 },
    ambivert: { introvert: 0.7, ambivert: 1.0, extrovert: 0.7 },
    extrovert: { introvert: 0.4, ambivert: 0.7, extrovert: 1.0 },
  };
  return map[p1.toLowerCase()]?.[p2.toLowerCase()] ?? 0.5;
};

export const calculateBudgetScore = (b1: number, b2: number): number => {
  if (Math.max(b1, b2) === 0) return 1;
  const diff = Math.abs(b1 - b2);
  const ratio = diff / Math.max(b1, b2);
  if (ratio <= 0.1) return 1.0;
  if (ratio <= 0.25) return 0.8;
  if (ratio <= 0.5) return 0.6;
  return Math.max(0.1, 1 - ratio);
};

export const calculateReligionScore = (r1?: string, r2?: string): number => {
  if (!r1 || !r2) return 0.5;
  if (r1.toLowerCase() === r2.toLowerCase()) return 1.0;
  const neutral = ["agnostic", "prefer_not_to_say", "none"];
  if (neutral.includes(r1.toLowerCase()) || neutral.includes(r2.toLowerCase())) return 0.5;
  return 0;
};

export const calculateAgeScore = (a1: number, a2: number): number => {
  const diff = Math.abs(a1 - a2);
  if (diff <= 2) return 1.0;
  if (diff <= 5) return 0.9;
  if (diff <= 10) return 0.7;
  return Math.max(0, 1 - diff / 30);
};

export const calculateLifestyleScore = (
  s1: string, d1: string,
  s2: string, d2: string
): number => {
  const smoke = s1 === s2 ? 1 : 0.5;
  const drink = d1 === d2 ? 1 : 0.5;
  return (smoke + drink) / 2;
};

// --- 3. DYNAMIC WEIGHTS & FINAL SCORING ---

const calculateDynamicWeights = (baseWeights: any, filterBoost: FilterBoost) => {
  const weights = { ...baseWeights };
  let totalBoost = 0;
  const coreFilters = ["destination", "dateOverlap", "budget"];

  for (const [key, config] of Object.entries(filterBoost)) {
    if (config && weights[key] && !coreFilters.includes(key)) {
      const original = weights[key];
      weights[key] *= (config as any).boost;
      totalBoost += weights[key] - original;
    }
  }

  if (totalBoost > 0) {
    const nonBoostedNonCore = Object.keys(weights).filter(k => !coreFilters.includes(k) && !(filterBoost as any)[k]);
    const remainingWeight = nonBoostedNonCore.reduce((sum, k) => sum + weights[k], 0);
    if (remainingWeight > 0) {
      const factor = (remainingWeight - totalBoost) / remainingWeight;
      for (const k of nonBoostedNonCore) weights[k] *= factor;
    }
  }
  return weights;
};

export const calculateFinalCompatibilityScore = async (
  user: SoloSession,
  match: SoloSession,
  filterBoost?: FilterBoost,
  useML: boolean = true,
  providedMLScore?: number | null
) => {
  const baseWeights = {
    destination: 0.25,
    dateOverlap: 0.2,
    budget: 0.2,
    interests: 0.1,
    age: 0.1,
    personality: 0.05,
    locationOrigin: 0.05,
    lifestyle: 0.03,
    religion: 0.02,
  };

  const weights = filterBoost ? calculateDynamicWeights(baseWeights, filterBoost) : baseWeights;
  const uA = user.static_attributes || ({} as any);
  const mA = match.static_attributes || ({} as any);

  const breakdown = {
    destinationScore: calculateDestinationScore(user.destination, match.destination),
    dateOverlapScore: calculateDateOverlapScore(user.startDate, user.endDate, match.startDate, match.endDate),
    budgetScore: calculateBudgetScore(user.budget, match.budget),
    interestScore: calculateJaccardSimilarity(uA.interests, mA.interests),
    personalityScore: getPersonalityCompatibility(uA.personality, mA.personality),
    religionScore: calculateReligionScore(uA.religion, mA.religion),
    ageScore: calculateAgeScore(uA.age || 25, mA.age || 25),
    lifestyleScore: calculateLifestyleScore(uA.smoking || "no", uA.drinking || "no", mA.smoking || "no", mA.drinking || "no"),
    locationOriginScore: 0.5, // Placeholder/simplified
  };

  const ruleBasedScore = Object.entries(breakdown).reduce((sum, [key, score]) => {
    const weightKey = key.replace("Score", "") as keyof typeof weights;
    return sum + score * (weights[weightKey] || 0);
  }, 0);

  let finalScore = ruleBasedScore;
  let mlScore = providedMLScore ?? undefined;

  if (useML && mlScore === undefined) {
    try {
      const { calculateMLCompatibilityScore } = await import("../ai/matching/ml-scoring");
      const mlResult = await calculateMLCompatibilityScore(user, match, { enabled: true, fallbackOnError: true });
      if (mlResult !== null) mlScore = mlResult;
    } catch {
      console.warn("⚠️ Internal ML scoring error inside solo script");
    }
  }

  // Use ML score only if it's a valid number
  if (typeof mlScore === "number" && !isNaN(mlScore)) {
    finalScore = mlScore * 0.6 + ruleBasedScore * 0.4;
  } else {
    // If ML is missing/null, use the rule-based score exclusively
    finalScore = ruleBasedScore;
  }

  // Final safety check for serialization
  if (isNaN(finalScore) || !isFinite(finalScore)) {
    finalScore = ruleBasedScore || 0.5;
  }

  return {
    score: parseFloat(finalScore.toFixed(3)),
    breakdown,
    mlScore: typeof mlScore === "number" ? parseFloat(mlScore.toFixed(3)) : undefined,
    budgetDifference: formatBudgetDifference(match.budget - user.budget)
  };
};

export const isCompatibleMatch = (user: SoloSession, match: SoloSession, maxDistanceKm: number = 200): boolean => {
  if (!user.destination || !match.destination) return false;
  const dScore = calculateDestinationScore(user.destination, match.destination, maxDistanceKm);
  const tScore = calculateDateOverlapScore(user.startDate, user.endDate, match.startDate, match.endDate);
  return dScore > 0 && tScore > 0;
};

const formatBudgetDifference = (diff: number): string => {
  if (diff === 0) return "Same budget";
  const abs = Math.abs(diff);
  const sign = diff > 0 ? "+" : "-";
  return `${sign}${abs >= 1000 ? (abs / 1000).toFixed(1) + "k" : abs}`;
};

export const formatBudget = (b: number): string => {
  if (b >= 100000) return `₹${(b / 100000).toFixed(1)}L`;
  if (b >= 1000) return `₹${(b / 1000).toFixed(0)}k`;
  return `₹${b}`;
};
