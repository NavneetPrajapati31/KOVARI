// -----------------------------------------------------------------------------
//   File 1: Matching Logic & Scoring Functions
// -----------------------------------------------------------------------------
// Location: /lib/matching/solo.ts
// Purpose: This file contains all the pure calculation and scoring logic.
// It is kept separate from the API handler for better organization and testing.

import { SoloSession, StaticAttributes } from '../../types'; // Assuming types are in /types/index.ts

// --- Helper function to calculate distance between two lat/lon points ---
const getHaversineDistance = (
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number => {
    // Edge Case: Handle invalid or missing coordinates
    if (typeof lat1 !== 'number' || typeof lon1 !== 'number' || typeof lat2 !== 'number' || typeof lon2 !== 'number') {
        return Infinity; // Return a large number to indicate an invalid distance
    }
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
};

// --- Scoring Functions for each attribute ---

const calculateDestinationScore = (dest1?: { lat: number, lon: number }, dest2?: { lat: number, lon: number }): number => {
    // Fallback: If either destination is missing, return neutral score instead of 0
    if (!dest1 || !dest2) return 0.3;
    
    const distance = getHaversineDistance(dest1.lat, dest1.lon, dest2.lat, dest2.lon);
    
    // Geocoding logic: Supports destinations within 200km radius with tiered scoring
    // This allows users to find travel companions going to nearby destinations
    if (distance === 0) return 1.0; // Same destination
    if (distance <= 25) return 0.95; // Very close (same city)
    if (distance <= 50) return 0.85; // Close (same metropolitan area)
    if (distance <= 100) return 0.75; // Nearby (same region)
    if (distance <= 200) return 0.6; // Within geocoding range (same state/province)
    if (distance <= 500) return 0.4; // Same country
    if (distance <= 1000) return 0.2; // Same continent
    
    return 0.1; // Different continent (never returns 0 to allow all matches)
};

const calculateDateOverlapScore = (start1: string, end1: string, start2: string, end2: string): number => {
    const s1 = new Date(start1).getTime();
    const e1 = new Date(end1).getTime();
    const s2 = new Date(start2).getTime();
    const e2 = new Date(end2).getTime();

    // Edge Case: Handle invalid dates
    if (isNaN(s1) || isNaN(e1) || isNaN(s2) || isNaN(e2)) return 0;

    const overlapStart = Math.max(s1, s2);
    const overlapEnd = Math.min(e1, e2);
    
    const overlapDuration = Math.max(0, overlapEnd - overlapStart);
    
    // Convert duration from milliseconds to days
    const overlapDays = overlapDuration / (1000 * 60 * 60 * 24);
    
    // FIXED: More flexible date overlap - minimum 1-day overlap instead of 2
    if (overlapDays < 1) {
        return 0; // No compatibility if less than 1 day overlap
    }

    const searchingUserTripDuration = e1 - s1;
    // Edge Case: Prevent division by zero if trip duration is 0
    if (searchingUserTripDuration <= 0) return 0;

    const totalDays = searchingUserTripDuration / (1000 * 60 * 60 * 24);
    const overlapRatio = overlapDays / totalDays;
    
    // Scoring based on overlap ratio with minimum 1-day requirement
    if (overlapRatio >= 0.8) return 1.0; // Almost complete overlap
    if (overlapRatio >= 0.5) return 0.9; // Good overlap
    if (overlapRatio >= 0.3) return 0.7; // Moderate overlap
    if (overlapRatio >= 0.2) return 0.5; // Some overlap
    if (overlapRatio >= 0.1) return 0.3; // Minimal overlap
    
    return 0.1; // Very minimal overlap but meets 1-day minimum
};

// NEW: Check if source and destination are the same
const isSameSourceDestination = (userSession: SoloSession, matchSession: SoloSession): boolean => {
    const userSource = userSession.static_attributes?.location;
    const userDest = userSession.destination;
    const matchSource = matchSession.static_attributes?.location;
    const matchDest = matchSession.destination;
    
    if (!userSource || !userDest || !matchSource || !matchDest) return false;
    
    // FIXED: Check if user's home location matches their destination (traveling to own city)
    const userHomeToUserDest = getHaversineDistance(
        userSource.lat, userSource.lon, 
        userDest.lat, userDest.lon
    );
    
    // FIXED: Check if match's home location matches their destination (traveling to own city)
    const matchHomeToMatchDest = getHaversineDistance(
        matchSource.lat, matchSource.lon, 
        matchDest.lat, matchDest.lon
    );
    
    // If either user is traveling to their own city, it's not a valid match
    return userHomeToUserDest <= 25 || matchHomeToMatchDest <= 25;
};

const getPersonalityCompatibility = (p1?: string, p2?: string): number => {
    // Fallback: If personality is missing, return a neutral score.
    if (!p1 || !p2) return 0.5;
    const compatibilityMap: Record<string, Record<string, number>> = {
        introvert: { introvert: 1.0, ambivert: 0.7, extrovert: 0.4 },
        ambivert:  { introvert: 0.7, ambivert: 1.0, extrovert: 0.7 },
        extrovert: { introvert: 0.4, ambivert: 0.7, extrovert: 1.0 },
    };
    return compatibilityMap[p1]?.[p2] ?? 0;
};

const calculateJaccardSimilarity = (set1?: string[], set2?: string[]): number => {
    // Fallback: If interests are missing, return neutral score instead of 0
    if (!set1 || !set2 || set1.length === 0 || set2.length === 0) return 0.3;
    
    const s1 = new Set(set1);
    const s2 = new Set(set2);
    const intersection = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    
    if (union.size === 0) return 0.5; // Both empty - neutral score
    
    const jaccardScore = intersection.size / union.size;
    
    // Boost score for having any common interests
    if (intersection.size > 0) {
        return Math.min(1.0, jaccardScore + 0.2); // Bonus for having any overlap
    }
    
    return jaccardScore;
};

const calculateBudgetScore = (budget1: number, budget2: number): number => {
    // Edge Case: Prevent division by zero if both budgets are 0.
    if (Math.max(budget1, budget2) === 0) return 1;
    
    const budgetDiff = Math.abs(budget1 - budget2);
    const maxBudget = Math.max(budget1, budget2);
    const ratio = budgetDiff / maxBudget;
    
    // More flexible budget scoring
    if (ratio <= 0.1) return 1.0; // Very similar budgets
    if (ratio <= 0.25) return 0.8; // Similar budgets
    if (ratio <= 0.5) return 0.6; // Moderately different
    if (ratio <= 1.0) return 0.4; // Different but manageable
    if (ratio <= 2.0) return 0.2; // Very different but possible
    
    return 0.1; // Extremely different but still some compatibility
};

const calculateReligionScore = (r1?: string, r2?: string): number => {
    // Fallback: If religion is missing, return a neutral score.
    if (!r1 || !r2) return 0.5;
    const neutralReligions = ['agnostic', 'prefer_not_to_say', 'none'];
    if (r1.toLowerCase() === r2.toLowerCase()) return 1.0;
    if (neutralReligions.includes(r1.toLowerCase()) || neutralReligions.includes(r2.toLowerCase())) return 0.5;
    return 0;
};

const calculateLocationOriginScore = (loc1?: { lat: number, lon: number }, loc2?: { lat: number, lon: number }): number => {
    // Fallback: If home location is missing, return a neutral score.
    if (!loc1 || !loc2) return 0.5;
    
    const distance = getHaversineDistance(loc1.lat, loc1.lon, loc2.lat, loc2.lon);
    
    // Optimized for finding people from similar regions
    if (distance <= 25) return 1.0; // Same city
    if (distance <= 100) return 0.8; // Same metropolitan area
    if (distance <= 200) return 0.6; // Same region (within geocoding range)
    if (distance <= 500) return 0.4; // Same state/province
    if (distance <= 1000) return 0.2; // Same country
    
    return 0.1; // Different country
};

const calculateAgeScore = (age1: number, age2: number): number => {
    if (Math.max(age1, age2) === 0) return 1;
    
    const ageDiff = Math.abs(age1 - age2);
    
    // More flexible age scoring with reasonable ranges
    if (ageDiff <= 2) return 1.0; // Very close in age
    if (ageDiff <= 5) return 0.9; // Close in age
    if (ageDiff <= 10) return 0.7; // Similar age group
    if (ageDiff <= 15) return 0.5; // Different but compatible age
    if (ageDiff <= 25) return 0.3; // Different age groups but possible
    if (ageDiff <= 40) return 0.1; // Large age difference but still compatible
    
    return 0.05; // Very large age difference but not impossible
};

const calculateLifestyleScore = (attrs1: StaticAttributes, attrs2: StaticAttributes): number => {
    const smokingMatch = attrs1.smoking === attrs2.smoking ? 1 : 0;
    const drinkingMatch = attrs1.drinking === attrs2.drinking ? 1 : 0;
    return (smokingMatch + drinkingMatch) / 2;
};


// --- Main Compatibility Score Calculation ---
// This function combines all individual scores using the defined weights.
// Priority order (descending): destination > dateOverlap > budget > interests > age > personality > locationOrigin > lifestyle > religion

export const calculateFinalCompatibilityScore = (userSession: SoloSession, matchSession: SoloSession): { score: number, breakdown: any, budgetDifference: string } => {
    const weights = {
        destination: 0.25,    // Highest priority - where they want to go
        dateOverlap: 0.20,    // Second priority - when they want to go (with 1-day minimum)
        budget: 0.20,         // Third priority - spending capacity
        interests: 0.10,      // Fourth priority - common interests
        age: 0.10,            // Fifth priority - age compatibility
        personality: 0.05,    // Sixth priority - personality match
        locationOrigin: 0.05, // Seventh priority - home location
        lifestyle: 0.03,      // Eighth priority - lifestyle choices
        religion: 0.02,       // Lowest priority - personal preference
    };

    const userAttrs = userSession.static_attributes;
    const matchAttrs = matchSession.static_attributes;

    // Calculate budget difference for display
    const budgetDiff = matchSession.budget - userSession.budget;
    const budgetDifference = formatBudgetDifference(budgetDiff);

    const scores = {
        destinationScore: calculateDestinationScore(userSession.destination, matchSession.destination),
        dateOverlapScore: calculateDateOverlapScore(userSession.startDate, userSession.endDate, matchSession.startDate, matchSession.endDate),
        personalityScore: getPersonalityCompatibility(userAttrs.personality, matchAttrs.personality),
        interestScore: calculateJaccardSimilarity(userAttrs.interests, matchAttrs.interests),
        budgetScore: calculateBudgetScore(userSession.budget, matchSession.budget),
        religionScore: calculateReligionScore(userAttrs.religion, matchAttrs.religion),
        locationOriginScore: calculateLocationOriginScore(userAttrs.location, matchAttrs.location),
        ageScore: calculateAgeScore(userAttrs.age, matchAttrs.age),
        lifestyleScore: calculateLifestyleScore(userAttrs, matchAttrs)
    };

    const finalScore =
        (scores.destinationScore * weights.destination) +
        (scores.dateOverlapScore * weights.dateOverlap) +
        (scores.personalityScore * weights.personality) +
        (scores.interestScore * weights.interests) +
        (scores.budgetScore * weights.budget) +
        (scores.religionScore * weights.religion) +
        (scores.locationOriginScore * weights.locationOrigin) +
        (scores.ageScore * weights.age) +
        (scores.lifestyleScore * weights.lifestyle);

    return { score: finalScore, breakdown: scores, budgetDifference };
};

// NEW: Enhanced compatibility check with source/destination validation
export const isCompatibleMatch = (userSession: SoloSession, matchSession: SoloSession): boolean => {
    // Check if source and destination are the same (should be avoided)
    if (isSameSourceDestination(userSession, matchSession)) {
        return false;
    }
    
    // Check date overlap (minimum 1 day)
    const dateOverlapScore = calculateDateOverlapScore(
        userSession.startDate, userSession.endDate, 
        matchSession.startDate, matchSession.endDate
    );
    
    // Check destination compatibility (should be same or nearby)
    const destinationScore = calculateDestinationScore(
        userSession.destination, matchSession.destination
    );
    
    // Both conditions must be met for compatibility
    return dateOverlapScore > 0 && destinationScore > 0;
};

// Helper function to format budget difference as "+5k" or "-5k INR"
const formatBudgetDifference = (difference: number): string => {
    if (difference === 0) return "Same budget";
    
    const absDiff = Math.abs(difference);
    const sign = difference > 0 ? "+" : "-";
    
    // More precise formatting for better user experience
    if (absDiff >= 1000) {
        const kValue = absDiff / 1000;
        // Show decimal for values like 9.5k, but not for whole numbers like 10k
        if (kValue % 1 === 0) {
            return `${sign}${kValue.toFixed(0)}k`;
        } else {
            return `${sign}${kValue.toFixed(1)}k`;
        }
    } else {
        return `${sign}${absDiff.toFixed(0)}`;
    }
};