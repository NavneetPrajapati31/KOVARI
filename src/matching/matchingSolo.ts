export interface Traveler {
    userId: string;
    dynamic: {
      destination: string;
      budget: number;
      mode: string;
      date: string;
    };
    static: any; // User profile data from Supabase
  }
  
  export interface MatchResult {
    userId: string;
    score: number;
  }
  
  /**
   * Calculate match score between two solo travelers
   */
  export function calculateMatchScore(traveler1: Traveler, traveler2: Traveler): number {
    let score = 0;
    
    // Destination match (40% weight)
    if (traveler1.dynamic.destination === traveler2.dynamic.destination) {
      score += 0.4;
    }
    
    // Budget compatibility (30% weight)
    const budgetDiff = Math.abs(traveler1.dynamic.budget - traveler2.dynamic.budget);
    const budgetScore = budgetDiff <= 5000 ? 1 : Math.max(0, 1 - (budgetDiff - 5000) / Math.max(traveler1.dynamic.budget, traveler2.dynamic.budget));
    score += budgetScore * 0.3;
    
    // Date compatibility (30% weight)
    const date1 = new Date(traveler1.dynamic.date);
    const date2 = new Date(traveler2.dynamic.date);
    const dateDiff = Math.abs(date1.getTime() - date2.getTime());
    const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
    const dateScore = daysDiff <= 7 ? 1 : Math.max(0, 1 - (daysDiff - 7) / 30); // Within 7 days = perfect, decreases over 30 days
    score += dateScore * 0.3;
    
    return score;
  }