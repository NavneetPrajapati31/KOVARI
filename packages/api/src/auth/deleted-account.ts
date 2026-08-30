/** User-facing copy when a deleted account attempts password/OAuth login. */
export const DELETED_ACCOUNT_LOGIN_MESSAGE =
  "Account not found or has been deleted.";

export type LoginUserIdentity = {
  isDeleted?: boolean | null;
};

/** Returns true when the row represents a soft-deleted account. */
export function isDeletedLoginUser(
  user: LoginUserIdentity | null | undefined,
): boolean {
  return user?.isDeleted === true;
}
