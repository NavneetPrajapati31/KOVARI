import { Transformer } from "@/types/api";

export interface MatchDTO {
  id: string;
  name: string;
  destination: string;
  budget: string;
  start_date: string;
  end_date: string;
  compatibility_score: number;
  budget_difference: number;
  is_solo_match: boolean;
  
  // 🛡️ Flattened fields for legacy/picky component support
  userId: string;
  age: number;
  gender?: string;
  personality?: string;
  nationality?: string;
  profession?: string;
  interests?: string[];
  languages?: string[];
  locationDisplay?: string;
  bio?: string;

  user?: {
    userId: string;
    name: string;
    age: number;
    gender?: string;
    personality?: string;
    bio?: string;
    avatar?: string;
    locationDisplay?: string;
    interests?: string[];
    languages?: string[];
    nationality?: string;
    religion?: string;
    profession?: string;
    smoking?: string;
    drinking?: string;
    foodPreference?: string;
  };
}

export class MatchTransformer implements Transformer<any, MatchDTO> {
  toStandard(m: any): MatchDTO {
    // Validate input presence
    if (!m || !m.userId) {
      throw new Error("Invalid match data: Missing mandatory field userId");
    }

    return {
      id: m.userId || m.id,
      name: m.user?.name || m.user?.full_name || m.name || 'Traveler',
      destination: m.user?.locationDisplay || m.user?.location || m.destination || 'India',
      budget: m.budget?.toString() || 'Flexible',
      start_date: m.startDate || m.start_date || new Date().toISOString(),
      end_date: m.endDate || m.end_date || new Date().toISOString(),
      compatibility_score: typeof m.compatibility_score === 'number' ? m.compatibility_score : (typeof m.score === 'number' ? m.score : 0),
      budget_difference: m.budgetDifference ?? m.budget_difference ?? 0,
      is_solo_match: true,

      // 🛡️ TOTAL FLATTENING: Every user field duplicated at Top Level
      userId: m.userId || m.id,
      age: typeof m.user?.age === 'number' ? m.user.age : (m.age || 0),
      gender: m.user?.gender || m.user?.Gender || m.gender,
      personality: m.user?.personality || m.user?.Personality || m.personality,
      nationality: m.user?.nationality || m.user?.Nationality || 'India',
      profession: m.user?.profession || m.user?.Profession || m.user?.job || m.profession,
      interests: m.user?.interests || m.user?.Interests || m.interests || [],
      languages: m.user?.languages || m.user?.Languages || m.languages || [],
      locationDisplay: m.user?.locationDisplay || m.user?.LocationDisplay || m.user?.location || m.destination || 'India',
      bio: m.user?.bio || m.user?.Bio || m.bio || '',

      user: {
        userId: m.userId || m.id,
        name: m.user?.name || m.user?.full_name || m.name || 'Traveler',
        age: typeof m.user?.age === 'number' ? m.user.age : (m.age || 0),
        gender: m.user?.gender || m.user?.Gender || m.gender,
        personality: m.user?.personality || m.user?.Personality || m.personality,
        bio: m.user?.bio || m.user?.Bio || m.bio || '',
        avatar: m.user?.avatar || m.user?.Avatar || m.avatar || '',
        locationDisplay: m.user?.locationDisplay || m.user?.LocationDisplay || m.user?.location || m.destination || 'India',
        interests: m.user?.interests || m.user?.Interests || m.interests || [],
        languages: m.user?.languages || m.user?.Languages || m.languages || [],
        nationality: m.user?.nationality || m.user?.Nationality || 'India',
        religion: m.user?.religion || m.user?.Religion,
        profession: m.user?.profession || m.user?.Profession || m.user?.job || m.profession,
        smoking: m.user?.smoking || m.user?.Smoking || m.smoking,
        drinking: m.user?.drinking || m.user?.Drinking || m.drinking,
        foodPreference: m.user?.foodPreference || m.user?.FoodPreference || m.foodPreference,
      }
    };
  }
}

export const matchTransformer = new MatchTransformer();
