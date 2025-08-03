// finalGroupMatchingLogic_with_ScoredLogistics.ts
// Matches a user against groups with a distance filter and a comprehensive weighted score.

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
  endDate: string;   // ISO: YYYY-MM-DD
  age: number;
  languages: string[];
  interests: string[];
  smoking: boolean;
  drinking: boolean;
  profession: string;
  nationality: string;
}

// Assumes 'averageAge' is automatically calculated by your database trigger
interface GroupProfile {
  groupId: string;
  name: string;
  destination: Location;
  averageBudget: number;
  startDate: string; // ISO: YYYY-MM-DD
  endDate: string;   // ISO: YYYY-MM-DD
  averageAge: number;
  dominantLanguages: string[];
  topInterests: string[];
  smokingPolicy: 'Smokers Welcome' | 'Mixed' | 'Non-Smoking';
  drinkingPolicy: 'Drinkers Welcome' | 'Mixed' | 'Non-Drinking';
  topProfessions: string[];
  dominantNationalities: string[];
}


// --- 2. HELPER & SCORING FUNCTIONS ---

/**
 * HARD FILTER: Calculates distance and checks if it's within the 200km limit.
 */
const isWithinDistance = (loc1: Location, loc2: Location): boolean => {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * (Math.PI / 180);
    const dLon = (loc2.lon - loc1.lon) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(loc1.lat * (Math.PI / 180)) * Math.cos(loc2.lat * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance <= 200;
};

/**
 * SCORE: Calculates budget similarity from 0 to 1.
 * A 20k difference results in a score of 0.5, a 40k difference results in a score of 0.
 */
const calculateBudgetScore = (userBudget: number, groupAverageBudget: number): number => {
    const budgetDifference = Math.abs(userBudget - groupAverageBudget);
    // The score decreases as the budget difference grows.
    return Math.max(0, 1 - budgetDifference / 40000);
};

/**
 * SCORE: Calculates date overlap score from 0 to 1.
 * The score is the number of overlapping days divided by the length of the user's trip.
 */
const calculateDateOverlapScore = (userStart: string, userEnd: string, groupStart: string, groupEnd: string): number => {
    const uStart = new Date(userStart).getTime();
    const uEnd = new Date(userEnd).getTime();
    const gStart = new Date(groupStart).getTime();
    const gEnd = new Date(groupEnd).getTime();

    const overlapStart = Math.max(uStart, gStart);
    const overlapEnd = Math.min(uEnd, gEnd);

    if (overlapStart > overlapEnd) {
        return 0; // No overlap
    }

    const overlapDuration = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
    const userTripDuration = (uEnd - uStart) / (1000 * 60 * 60 * 24) + 1;

    // Normalize the score based on the user's trip length
    return Math.min(1, overlapDuration / userTripDuration);
};


// ... (All other helper functions for age, interest, lifestyle, etc. remain the same)
const calculateAgeScore = (userAge: number, groupAverageAge: number): number => {
    if (!groupAverageAge) return 0;
    const ageDifference = Math.abs(userAge - groupAverageAge);
    return Math.max(0, 1 - ageDifference / 20);
};

const calculateJaccardSimilarity = (setA: string[], setB: string[]): number => {
    const uniqueA = new Set(setA);
    const uniqueB = new Set(setB);
    const intersectionSize = new Set([...uniqueA].filter(x => uniqueB.has(x))).size;
    const unionSize = uniqueA.size + uniqueB.size - intersectionSize;
    return unionSize === 0 ? 0 : intersectionSize / unionSize;
};


// --- 3. CORE MATCHING FUNCTION ---

/**
 * Finds the best group matches for a user with a distance filter and comprehensive scoring.
 * @param user The profile of the user searching.
 * @param allGroups An array of group profiles fetched from your database.
 * @returns A ranked list of matched groups.
 */
export const findGroupMatchesForUser = (user: UserProfile, allGroups: GroupProfile[]) => {

  // Step 1: Apply the hard distance filter. Only groups within 200km are considered.
  const nearbyGroups = allGroups.filter(group => isWithinDistance(user.destination, group.destination));

  // Step 2: Calculate a comprehensive, weighted score for every nearby group.
  const scoredMatches = nearbyGroups.map(group => {
    // Define the importance of each category in the final score
    const weights = {
        logistics: 0.50, // Budget and Dates now part of logistics
        vibe: 0.50,      // Social compatibility
    };

    // --- Calculate the Logistics Score ---
    const budgetScore = calculateBudgetScore(user.budget, group.averageBudget);
    const dateOverlapScore = calculateDateOverlapScore(user.startDate, user.endDate, group.startDate, group.endDate);
    const logisticsScore = (budgetScore * 0.5) + (dateOverlapScore * 0.5); // Equal weight to budget and dates

    // --- Calculate the Vibe Score ---
    const ageScore = calculateAgeScore(user.age, group.averageAge);
    const languageScore = calculateJaccardSimilarity(user.languages, group.dominantLanguages);
    const interestScore = calculateJaccardSimilarity(user.interests, group.topInterests);
    // You can add lifestyle and background scores here as well
    const vibeScore = (ageScore * 0.3) + (languageScore * 0.3) + (interestScore * 0.4);

    // --- Calculate the Final Combined Score ---
    const finalScore = (logisticsScore * weights.logistics) + (vibeScore * weights.vibe);

    return {
      group,
      score: parseFloat(finalScore.toFixed(3)),
      breakdown: { // Optional: include for debugging or more detailed UI
        logisticsScore: parseFloat(logisticsScore.toFixed(3)),
        vibeScore: parseFloat(vibeScore.toFixed(3))
      }
    };
  });

  // Step 3: Rank the scored matches from highest to lowest.
  return scoredMatches.sort((a, b) => b.score - a.score);
};