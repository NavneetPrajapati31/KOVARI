import { Transformer } from "@/types/api";

export interface ProfileDTO {
  id: string;
  name: string;
  username: string;
  avatar: string;
  location: string;
  age: number;
  bio: string;
  job: string;
  interests: string[];
  [key: string]: any;
}

export class ProfileTransformer implements Transformer<any, ProfileDTO> {
  toStandard(p: any): ProfileDTO {
    if (!p) throw new Error("Invalid profile data: Null/Undefined");

    return {
      id: p.user_id || p.id,
      name: p.name || "",
      username: p.username || "",
      avatar: p.profile_photo || p.avatar || "",
      location: p.location || "",
      age: p.age || 0,
      bio: p.bio || "",
      job: p.job || p.profession || "",
      interests: p.interests || [],
      // Preserving other complex fields if present
      languages: p.languages || [],
      nationality: p.nationality || "",
      personality: p.personality || "",
      foodPreference: p.food_preference || p.foodPreference || "",
      smoking: p.smoking || "",
      drinking: p.drinking || "",
    };
  }
}

export const profileTransformer = new ProfileTransformer();
