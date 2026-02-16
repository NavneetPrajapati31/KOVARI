// Optimized group matching: weighted scoring, distance decay, pre-computed Jaccard.
// Industry patterns: content-based filtering, distance decay, weighted multi-factor scoring.

// --- 1. DATA TYPE DEFINITIONS ---

interface Location {
  lat: number;
  lon: number;
}

interface UserProfile {
  userId: string;
  destination: Location;
  budget: number;
  startDate: string; // ISO: YYYY-MM-DD
  endDate: string; // ISO: YYYY-MM-DD
  age: number;
  languages: string[];
  interests: string[];
  smoking: boolean;
  drinking: boolean;
  nationality: string;
}

interface GroupProfile {
  groupId: string;
  name: string;
  destination: Location;
  averageBudget: number;
  startDate: string;
  endDate: string;
  averageAge: number;
  dominantLanguages: string[];
  topInterests: string[];
  smokingPolicy: "Smokers Welcome" | "Mixed" | "Non-Smoking";
  drinkingPolicy: "Drinkers Welcome" | "Mixed" | "Non-Drinking";
  dominantNationalities: string[];
  /** Optional: pre-computed distance in km for distance decay scoring */
  distanceKm?: number;
}

// --- 2. HELPER & SCORING FUNCTIONS ---

/** Haversine distance in km (optimized, single computation) */
const haversineKm = (a: Location, b: Location): number => {
  const R = 6371;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLon = (b.lon - a.lon) * (Math.PI / 180);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.lat * (Math.PI / 180)) *
      Math.cos(b.lat * (Math.PI / 180)) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const isWithinDistance = (
  loc1: Location,
  loc2: Location,
  maxDistanceKm: number = 200,
): boolean => haversineKm(loc1, loc2) <= maxDistanceKm;

/**
 * SCORE: Calculates budget similarity from 0 to 1.
 */
const calculateBudgetScore = (
  userBudget: number,
  groupAverageBudget: number,
): number => {
  // If the group is within (or cheaper than) the user's budget, it's a perfect match.
  if (groupAverageBudget <= userBudget) return 1.0;

  const budgetDifference = groupAverageBudget - userBudget;
  // Score decreases as the group gets more expensive than the user's budget.
  // It reaches 0 if the difference is 40k or more.
  return Math.max(0, 1 - budgetDifference / 40000);
};

/**
 * SCORE: Calculates date overlap score from 0 to 1.
 */
const calculateDateOverlapScore = (
  userStart: string,
  userEnd: string,
  groupStart: string,
  groupEnd: string,
): number => {
  const uStart = new Date(userStart).getTime();
  const uEnd = new Date(userEnd).getTime();
  const gStart = new Date(groupStart).getTime();
  const gEnd = new Date(groupEnd).getTime();

  const overlapStart = Math.max(uStart, gStart);
  const overlapEnd = Math.min(uEnd, gEnd);

  if (overlapStart > overlapEnd) return 0;

  const overlapDuration =
    (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
  const userTripDuration = (uEnd - uStart) / (1000 * 60 * 60 * 24) + 1;

  return Math.min(1, overlapDuration / userTripDuration);
};

/**
 * SCORE: Calculates age similarity score. MVP: neutral when group has no average_age.
 */
const calculateAgeScore = (
  userAge: number,
  groupAverageAge: number,
): number => {
  if (!groupAverageAge) return 0.5; // No age data: neutral, don't penalize
  const ageDifference = Math.abs(userAge - groupAverageAge);
  return Math.max(0, 1 - ageDifference / 20);
};

/** Jaccard similarity using pre-computed Sets. Empty signals => neutral 0.5 (MVP: avoid penalizing sparse data) */
const jaccardFromSets = (setA: Set<string>, setB: Set<string>): number => {
  if (setA.size === 0 && setB.size === 0) return 0.5; // Both empty: neutral, don't penalize
  if (setA.size === 0 || setB.size === 0) return 0.5; // One empty: neutral (can't compute Jaccard meaningfully)
  let intersection = 0;
  const smaller = setA.size <= setB.size ? setA : setB;
  const larger = setA.size <= setB.size ? setB : setA;
  for (const x of smaller) if (larger.has(x)) intersection++;
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0.5 : intersection / union;
};

/**
 * SCORE: Calculates lifestyle compatibility (smoking & drinking).
 */
const calculateLifestyleScore = (
  user: UserProfile,
  group: GroupProfile,
): number => {
  let smokingScore = 0;
  if (
    (user.smoking && group.smokingPolicy === "Smokers Welcome") ||
    (!user.smoking && group.smokingPolicy === "Non-Smoking")
  ) {
    smokingScore = 1.0;
  } else if (group.smokingPolicy === "Mixed") {
    smokingScore = 0.6;
  }

  let drinkingScore = 0;
  if (
    (user.drinking && group.drinkingPolicy === "Drinkers Welcome") ||
    (!user.drinking && group.drinkingPolicy === "Non-Drinking")
  ) {
    drinkingScore = 1.0;
  } else if (group.drinkingPolicy === "Mixed") {
    drinkingScore = 0.6;
  }

  return (smokingScore + drinkingScore) / 2;
};

const calculateBackgroundScore = (
  user: UserProfile,
  group: GroupProfile,
): number => {
  if (!user.nationality || user.nationality === "Unknown" || user.nationality === "Any") return 0.5;
  if (!group.dominantNationalities?.length) return 0.5; // No nationality data: neutral
  return group.dominantNationalities.some(
    (n) => n.toLowerCase() === user.nationality.toLowerCase(),
  )
    ? 1.0
    : 0.0;
};

/** Distance decay: closer groups get a small boost (0–1, higher = closer) */
const distanceDecayScore = (distanceKm: number, maxKm: number): number => {
  if (distanceKm <= 0) return 1;
  if (distanceKm >= maxKm) return 0;
  return 1 - distanceKm / maxKm;
};

// --- 3. CORE MATCHING FUNCTION ---

/**
 * Finds the best group matches using weighted multi-factor scoring.
 * Groups are expected to already be distance-filtered; no redundant filter.
 * Uses pre-computed user Sets for Jaccard and distance decay for proximity boost.
 */
export const findGroupMatchesForUser = (
  user: UserProfile,
  allGroups: GroupProfile[],
  maxDistanceKm: number = 200,
) => {
  // Pre-compute user sets once for Jaccard (avoids O(n) Set creations)
  const userLangSet = new Set(
    (user.languages || []).map((s) => s.toLowerCase().trim()).filter(Boolean),
  );
  const userInterestSet = new Set(
    (user.interests || []).map((s) => s.toLowerCase().trim()).filter(Boolean),
  );

  const weights = {
    budget: 0.18,
    dateOverlap: 0.2,
    interests: 0.15,
    age: 0.12,
    language: 0.1,
    lifestyle: 0.1,
    background: 0.05,
    distance: 0.1, // Proximity boost (industry standard: closer = better)
  };

  const scoredMatches = allGroups.map((group) => {
    const budgetScore = calculateBudgetScore(user.budget, group.averageBudget);
    const dateOverlapScore = calculateDateOverlapScore(
      user.startDate,
      user.endDate,
      group.startDate,
      group.endDate,
    );
    const groupInterestSet = new Set(
      (group.topInterests || []).map((s) => String(s).toLowerCase().trim()),
    );
    const groupLangSet = new Set(
      (group.dominantLanguages || []).map((s) =>
        String(s).toLowerCase().trim(),
      ),
    );
    const interestScore = jaccardFromSets(userInterestSet, groupInterestSet);
    const ageScore = calculateAgeScore(user.age, group.averageAge);
    const languageScore = jaccardFromSets(userLangSet, groupLangSet);
    const lifestyleScore = calculateLifestyleScore(user, group);
    const backgroundScore = calculateBackgroundScore(user, group);
    const distanceScore =
      group.distanceKm !== undefined
        ? distanceDecayScore(group.distanceKm, maxDistanceKm)
        : 1; // No distance info: neutral

    const finalScore =
      budgetScore * weights.budget +
      dateOverlapScore * weights.dateOverlap +
      interestScore * weights.interests +
      ageScore * weights.age +
      languageScore * weights.language +
      lifestyleScore * weights.lifestyle +
      backgroundScore * weights.background +
      distanceScore * weights.distance;

    return {
      group,
      score: Math.round(finalScore * 1000) / 1000,
      breakdown: {
        budget: Math.round(budgetScore * 1000) / 1000,
        dates: Math.round(dateOverlapScore * 1000) / 1000,
        interests: Math.round(interestScore * 1000) / 1000,
        age: Math.round(ageScore * 1000) / 1000,
      },
    };
  });

  // Single-pass sort: highest score first
  scoredMatches.sort((a, b) => b.score - a.score);
  return scoredMatches;
};
