export interface FiltersState {
  destination: string;
  dateStart: Date | undefined;
  dateEnd: Date | undefined;
  ageMin: number;
  ageMax: number;
  gender: string;
  interests: string[];
  personality: string;
  smoking: string;
  drinking: string;
  budgetRange: string;
  nationality: string;
  languages: string[];
}

export {};
