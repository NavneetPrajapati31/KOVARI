export interface SearchData {
  destination: string;
  destinationDetails?: {
    city?: string;
    state?: string;
    country?: string;
    lat?: number;
    lon?: number;
    formatted?: string;
    place_id?: string;
  };
  budget: number;
  startDate: Date;
  endDate: Date;
  travelMode: "solo" | "group";
}

export interface Filters {
  ageRange: [number, number];
  gender: string;
  interests: string[];
  travelStyle: string;
  budgetRange: [number, number];
  personality: string;
  smoking: string;
  drinking: string;
  nationality: string;
  languages: string[];
}

export interface SoloMatch {
  id: string;
  name: string;
  destination: string;
  budget: string;
  start_date: Date;
  end_date: Date;
  compatibility_score: number;
  budget_difference: string;
  user: {
    userId: string;
    full_name?: string;
    name?: string;
    age?: number;
    gender?: string;
    personality?: string;
    interests?: string[];
    profession?: string;
    avatar?: string;
    nationality?: string;
    smoking?: string;
    drinking?: string;
    religion?: string;
    languages?: string[];
    location?: { lat: number; lon: number };
    locationDisplay?: string;
    foodPreference?: string;
    bio?: string;
  };
  is_solo_match: boolean;
}

export interface GroupMatch {
  id: string;
  name: string;
  cover_image?: string;
  description?: string;
  destination: string;
  startDate: string | Date;
  endDate: string | Date;
  budget?: number;
  score?: number;
  breakdown?: {
    budget: number;
    dates: number;
    interests: number;
    age: number;
  };
  creator?: {
    name: string;
    username?: string;
    avatar?: string;
  };
  memberCount?: number;
  tags?: string[];
  privacy?: "public" | "private";
  smokingPolicy?: "Smokers Welcome" | "Mixed" | "Non-Smoking";
  drinkingPolicy?: "Drinkers Welcome" | "Mixed" | "Non-Drinking";
  languages?: string[];
}
