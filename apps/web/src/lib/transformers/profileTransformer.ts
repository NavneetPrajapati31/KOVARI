import { Transformer } from "@/types/api";
import { profileMapper } from "../mappers/profileMapper";

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

    // Resolve user context (if nested via join) or use the object itself as fallback
    const userRow = p.users || p;
    const dto = profileMapper.fromDb(userRow, p);

    return {
      ...dto,
      name: dto.displayName,
      job: dto.profession, // Backward compat for 'job' field
    };
  }
}

export const profileTransformer = new ProfileTransformer();

