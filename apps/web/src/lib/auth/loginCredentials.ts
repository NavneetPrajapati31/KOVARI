import { isDeletedLoginUser } from "@kovari/api/auth/deleted-account";

export const LOGIN_USER_SELECT =
  'id, email, password_hash, banned, ban_reason, ban_expires_at, "isDeleted", profiles(name)';

export type LoginUserRecord = {
  id: string;
  email: string | null;
  password_hash: string | null;
  banned?: boolean | null;
  ban_reason?: string | null;
  ban_expires_at?: string | null;
  isDeleted?: boolean | null;
  profiles?: unknown;
};

export type PasswordLoginEvaluation = "ok" | "deleted" | "invalid";

/** Evaluates email/password credentials against a login user row. */
export async function evaluatePasswordLogin(
  user: LoginUserRecord | null,
  password: string,
  compare: (password: string, hash: string) => Promise<boolean>,
): Promise<PasswordLoginEvaluation> {
  if (isDeletedLoginUser(user)) {
    return "deleted";
  }

  if (
    !user ||
    !user.password_hash ||
    !(await compare(password, user.password_hash))
  ) {
    return "invalid";
  }

  return "ok";
}
