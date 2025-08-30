export interface SearchData {
  destination: string;
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
