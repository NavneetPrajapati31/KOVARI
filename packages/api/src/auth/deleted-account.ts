/** User-facing copy when a deleted account attempts password/OAuth login. */
export const DELETED_ACCOUNT_LOGIN_MESSAGE =
  "Account not found or has been deleted.";

export type LoginUserIdentity = {
  isDeleted?: boolean | null;
  deletedAt?: string | null;
};

type AuditLogQueryClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        contains: (
          column: string,
          value: Record<string, string>,
        ) => {
          limit: (count: number) => {
            maybeSingle: () => Promise<{ data: { id: string } | null }>;
          };
        };
      };
    };
  };
};

/** Normalizes login email for tombstone and lookup comparisons. */
export function normalizeLoginEmail(email: string): string {
  return email.toLowerCase().trim();
}

/** Returns true when the row represents a soft-deleted account. */
export function isDeletedLoginUser(
  user: LoginUserIdentity | null | undefined,
): boolean {
  return user?.isDeleted === true || user?.deletedAt != null;
}

/**
 * Checks audit logs for a deleted-account tombstone recorded at deletion time.
 * Used when the users row no longer retains the email after GDPR anonymization.
 */
export async function isDeletedAccountEmail(
  supabase: AuditLogQueryClient,
  email: string,
): Promise<boolean> {
  const normalized = normalizeLoginEmail(email);
  if (!normalized) return false;

  const { data } = await supabase
    .from("audit_logs")
    .select("id")
    .eq("action", "ACCOUNT_DELETED")
    .contains("details", { deletedEmail: normalized })
    .limit(1)
    .maybeSingle();

  return !!data;
}
