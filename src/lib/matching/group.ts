// finalGroupMatchingLogic_with_DetailedWeights.ts
// Matches a user against groups with a distance filter and a comprehensive, detailed weighted score.

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
 */
const calculateBudgetScore = (userBudget: number, groupAverageBudget: number): number => {
    const budgetDifference = Math.abs(userBudget - groupAverageBudget);
    return Math.max(0, 1 - budgetDifference / 40000); // Score is 0 if difference is 40k or more
};

/**
 * SCORE: Calculates date overlap score from 0 to 1.
 */
const calculateDateOverlapScore = (userStart: string, userEnd: string, groupStart: string, groupEnd: string): number => {
    const uStart = new Date(userStart).getTime();
    const uEnd = new Date(userEnd).getTime();
    const gStart = new Date(groupStart).getTime();
    const gEnd = new Date(groupEnd).getTime();

    const overlapStart = Math.max(uStart, gStart);
    const overlapEnd = Math.min(uEnd, gEnd);

    if (overlapStart > overlapEnd) return 0;

    const overlapDuration = (overlapEnd - overlapStart) / (1000 * 60 * 60 * 24) + 1;
    const userTripDuration = (uEnd - uStart) / (1000 * 60 * 60 * 24) + 1;

    return Math.min(1, overlapDuration / userTripDuration);
};

/**
 * SCORE: Calculates age similarity score.
 */
const calculateAgeScore = (userAge: number, groupAverageAge: number): number => {
    if (!groupAverageAge) return 0;
    const ageDifference = Math.abs(userAge - groupAverageAge);
    return Math.max(0, 1 - ageDifference / 20);
};

/**
 * SCORE: Calculates Jaccard similarity for arrays (languages, interests).
 */
const calculateJaccardSimilarity = (setA: string[], setB: string[]): number => {
    const uniqueA = new Set(setA);
    const uniqueB = new Set(setB);
    const intersectionSize = new Set([...uniqueA].filter(x => uniqueB.has(x))).size;
    const unionSize = uniqueA.size + uniqueB.size - intersectionSize;
    return unionSize === 0 ? 0 : intersectionSize / unionSize;
};

/**
 * SCORE: Calculates lifestyle compatibility (smoking & drinking).
 */
const calculateLifestyleScore = (user: UserProfile, group: GroupProfile): number => {
    let smokingScore = 0;
    if ((user.smoking && group.smokingPolicy === 'Smokers Welcome') || (!user.smoking && group.smokingPolicy === 'Non-Smoking')) {
        smokingScore = 1.0;
    } else if (group.smokingPolicy === 'Mixed') {
        smokingScore = 0.6;
    }

    let drinkingScore = 0;
    if ((user.drinking && group.drinkingPolicy === 'Drinkers Welcome') || (!user.drinking && group.drinkingPolicy === 'Non-Drinking')) {
        drinkingScore = 1.0;
    } else if (group.drinkingPolicy === 'Mixed') {
        drinkingScore = 0.6;
    }

    return (smokingScore + drinkingScore) / 2;
};

/**
 * SCORE: Calculates background compatibility (nationality only).
 */
const calculateBackgroundScore = (user: UserProfile, group: GroupProfile): number => {
    const nationalityScore = group.dominantNationalities.includes(user.nationality) ? 1.0 : 0.0;
    return nationalityScore;
};


// --- 3. CORE MATCHING FUNCTION ---

/**
 * Finds the best group matches for a user with a distance filter and a comprehensive weighted score.
 * @param user The profile of the user searching.
 * @param allGroups An array of group profiles fetched from your database.
 * @returns A ranked list of matched groups.
 */
export const findGroupMatchesForUser = (user: UserProfile, allGroups: GroupProfile[]) => {

  // Step 1: Apply the hard distance filter. Only groups within 200km are considered.
  const nearbyGroups = allGroups.filter(group => isWithinDistance(user.destination, group.destination));

  // Step 2: Calculate a comprehensive, weighted score for every nearby group.
  const scoredMatches = nearbyGroups.map(group => {
    // Define the importance of each attribute in the final score. Total must be 1.0.
    const weights = {
        budget: 0.20,
        dateOverlap: 0.20,
        interests: 0.15,
        age: 0.15,
        language: 0.10,
        lifestyle: 0.10,      // Smoking & Drinking
        background: 0.10,     // Profession & Nationality
    };

    // --- Calculate a score for each individual attribute ---
    const budgetScore = calculateBudgetScore(user.budget, group.averageBudget);
    const dateOverlapScore = calculateDateOverlapScore(user.startDate, user.endDate, group.startDate, group.endDate);
    const interestScore = calculateJaccardSimilarity(user.interests, group.topInterests);
    const ageScore = calculateAgeScore(user.age, group.averageAge);
    const languageScore = calculateJaccardSimilarity(user.languages, group.dominantLanguages);
    const lifestyleScore = calculateLifestyleScore(user, group);
    const backgroundScore = calculateBackgroundScore(user, group);

    // --- Calculate the Final Weighted Score ---
    const finalScore =
        (budgetScore * weights.budget) +
        (dateOverlapScore * weights.dateOverlap) +
        (interestScore * weights.interests) +
        (ageScore * weights.age) +
        (languageScore * weights.language) +
        (lifestyleScore * weights.lifestyle) +
        (backgroundScore * weights.background);

    return {
      group,
      score: parseFloat(finalScore.toFixed(3)),
      breakdown: { // Optional: include for debugging or more detailed UI
        budget: parseFloat(budgetScore.toFixed(3)),
        dates: parseFloat(dateOverlapScore.toFixed(3)),
        interests: parseFloat(interestScore.toFixed(3)),
        age: parseFloat(ageScore.toFixed(3)),
        //... add other scores if needed for the UI
      }
    };
  });

  // Step 3: Rank the scored matches from highest to lowest.
  return scoredMatches.sort((a, b) => b.score - a.score);
};