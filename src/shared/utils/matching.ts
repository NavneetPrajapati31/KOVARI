// lib/utils/matching.ts

export interface Traveler {
    id: string;
    name: string;
    age: number;
    destination: string;
    startDate: string; 
    endDate: string;   
    interests: string[];
    travelModes: string[];
    profession: string;
}

export function calculateMatchScore(user: Traveler, other: Traveler): number {
    let score = 0;

    // ✅ Same destination (weight: 40)
    if (user.destination === other.destination) {
        score += 40;
    }

    // ✅ 2+ shared interests (weight: 25)
    const sharedInterests = user.interests.filter(i => other.interests.includes(i));
    if (sharedInterests.length >= 2) {
        score += 25;
    }

    // ✅ Age within ±5 years (weight: 15)
    if (Math.abs(user.age - other.age) <= 5) {
        score += 15;
    }

    // ✅ Compatible travel modes (weight: 15)
    const travelMatch = user.travelModes.some(mode => other.travelModes.includes(mode));
    if (travelMatch) {
        score += 15;
    }

    // ✅ Same profession (weight: 5)
    if (user.profession === other.profession) {
        score += 5;
    }

    return score;
}
  