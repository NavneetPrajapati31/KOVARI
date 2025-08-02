export interface Traveler {
  budget: number;
  startDate: Date;
  endDate: Date;
  destination: string;
}

export interface Group {
  id: string;
  budget: number;
  startDate: Date;
  endDate: Date;
  destination: string;
  creator?: {
    name: string;
    username: string;
    avatar?: string;
  };
}


export interface MatchResult extends Group {
  score: number;
}

export interface MatchWeights {
  destination: number; // e.g. 0.4
  budget: number;      // e.g. 0.3
  dates: number;       // e.g. 0.3
}

/**
 * Returns groups with a weighted match score based on destination, budget, and date overlap.
 * @param traveler Traveler's preferences
 * @param groups List of groups to match against
 * @param weights Weights for each attribute (should sum to 1)
 */
export function matchGroupsWeighted(
  traveler: Traveler,
  groups: Group[],
  weights: MatchWeights = { destination: 0.4, budget: 0.3, dates: 0.3 }
): MatchResult[] {
  return groups
    .map((group) => {
      // Destination: 1 if exact match, 0 otherwise
      const destinationScore = group.destination === traveler.destination ? 1 : 0;

      // Budget: 1 if within ±5000, otherwise decreases as difference increases, min 0
      const budgetDiff = Math.abs(group.budget - traveler.budget);
      const budgetScore = budgetDiff <= 5000 ? 1 : Math.max(0, 1 - (budgetDiff - 5000) / traveler.budget);

      // Dates: score is proportion of overlap days to traveler's total days
      const groupStart = new Date(group.startDate).getTime();
      const groupEnd = new Date(group.endDate).getTime();
      const travelerStart = new Date(traveler.startDate).getTime();
      const travelerEnd = new Date(traveler.endDate).getTime();
      const overlapStart = Math.max(groupStart, travelerStart);
      const overlapEnd = Math.min(groupEnd, travelerEnd);
      const overlapMs = Math.max(0, overlapEnd - overlapStart);
      const overlapDays = overlapMs > 0 ? overlapMs / (1000 * 60 * 60 * 24) + 1 : 0;
      const travelerDays = (travelerEnd - travelerStart) / (1000 * 60 * 60 * 24) + 1;
      const dateScore = Math.max(0, Math.min(1, overlapDays / travelerDays));

      // Weighted total score
      const score =
        destinationScore * weights.destination +
        budgetScore * weights.budget +
        dateScore * weights.dates;

      return { ...group, score };
    })
    .sort((a, b) => b.score - a.score);
}
