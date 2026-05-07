import { Transformer } from "@/types/api";

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  accessToken?: string;
  refreshToken?: string;
  banned?: boolean;
  banReason?: string | null;
  banExpiresAt?: string | null;
}

export class UserTransformer implements Transformer<any, UserDTO> {
  toStandard(u: any): UserDTO {
    // Standard User DTO for auth and lookup
    return {
      id: u.id || u.clerk_user_id || "",
      email: u.email || "",
      name: u.name || "",
      accessToken: u.accessToken,
      refreshToken: u.refreshToken,
      banned: u.banned ?? false,
      banReason: u.ban_reason || u.banReason || null,
      banExpiresAt: u.ban_expires_at || u.banExpiresAt || null,
    };
  }
}

export const userTransformer = new UserTransformer();
