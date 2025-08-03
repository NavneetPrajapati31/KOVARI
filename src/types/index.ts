export interface StaticAttributes {
  age: number;
  gender: string;
  personality: string;
  location: {
    lat: number;
    lon: number;
  };
  smoking: boolean;
  drinking: boolean;
  religion: string;
  interests: string[];
  language: string[];
  nationality: string;
  profession: string;
}

export interface SoloSession {
  userId?: string;
  destination: {
    name?: string;
    lat: number;
    lon: number;
  };
  budget: number;
  startDate: string;
  endDate: string;
  mode: string;
  static_attributes: StaticAttributes;
} 