import { Transformer } from "@/types/api";

export interface MatchDTO {
  userId: string;
  name: string;
  age: number;
  location: string;
  profilePhoto: string;
  compatibilityScore: number;
  breakdown: Record<string, any>;
  budgetDifference: number;
  startDate?: string;
  endDate?: string;
  budget?: number;
  // Keep original user object nested for consistency if needed
  user?: any;
}

export class MatchTransformer implements Transformer<any, MatchDTO> {
  toStandard(m: any): MatchDTO {
    // Validate input presence
    if (!m || !m.userId) {
      throw new Error("Invalid match data: Missing mandatory field userId");
    }

    return {
      userId: m.userId,
      name: m.user?.name || m.user?.full_name || 'Unknown',
      age: typeof m.user?.age === 'number' ? m.user.age : 0,
      location: m.user?.location || m.user?.locationDisplay || 'Unknown',
      profilePhoto: m.user?.avatar || '',
      compatibilityScore: typeof m.score === 'number' ? m.score : 0,
      breakdown: m.breakdown || {},
      budgetDifference: m.budgetDifference || 0,
      startDate: m.startDate,
      endDate: m.endDate,
      budget: m.budget,
      user: {
        ...m.user,
        userId: m.userId,
        name: m.user?.name || m.user?.full_name || 'Unknown',
        age: typeof m.user?.age === 'number' ? m.user.age : 0,
        locationDisplay: m.user?.location || m.user?.locationDisplay || 'Unknown',
        avatar: m.user?.avatar || '',
      }
    };
  }
}

export const matchTransformer = new MatchTransformer();
