  // -----------------------------------------------------------------------------
  //   File : Types
  // -----------------------------------------------------------------------------
  // Location: /src/types/index.ts

  export interface StaticAttributes {
    age: number;
    gender: string;
    personality: string;
    location: {
      lat: number;
      lon: number;
    };
    smoking: string;
    drinking: string;
    religion: string;
    interests: string[];
    language: string;
    languages?: string[];
    nationality: string;
    profession: string;
    avatar?: string;
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