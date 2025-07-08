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
  
    // ✅ Same destination
    if (user.destination === other.destination) {
      score += 30;
    }
  
    // ✅ Overlapping dates
    const userStart = new Date(user.startDate).getTime();
    const userEnd = new Date(user.endDate).getTime();
    const otherStart = new Date(other.startDate).getTime();
    const otherEnd = new Date(other.endDate).getTime();
    const datesOverlap = Math.max(userStart, otherStart) <= Math.min(userEnd, otherEnd);
    if (datesOverlap) {
      score += 20;
    }
  
    // ✅ 2+ shared interests
    const sharedInterests = user.interests.filter(i => other.interests.includes(i));
    if (sharedInterests.length >= 2) {
      score += 15;
    }
  
    // ✅ Age within ±5 years
    if (Math.abs(user.age - other.age) <= 5) {
      score += 10;
    }
  
    // ✅ Compatible travel modes
    const travelMatch = user.travelModes.some(mode => other.travelModes.includes(mode));
    if (travelMatch) {
      score += 10;
    }
  
    // ✅ Same profession
    if (user.profession === other.profession) {
      score += 5;
    }
  
    return score;
  }
  