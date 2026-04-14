import { Transformer } from "@/types/api";

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
}

export class UserTransformer implements Transformer<any, UserDTO> {
  toStandard(u: any): UserDTO {
    // Standard User DTO for auth and lookup
    return {
      id: u.id || u.clerk_user_id || "",
      email: u.email || "",
      name: u.name || "",
      accessToken: u.accessToken,
      refreshToken: u.refreshToken
    };
  }
}

export const userTransformer = new UserTransformer();
