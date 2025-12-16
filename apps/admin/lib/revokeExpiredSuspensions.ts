// apps/admin/lib/revokeExpiredSuspensions.ts
import { supabaseAdmin } from "./supabaseAdmin";

/**
 * Checks for users with expired suspensions and automatically revokes them.
 * A suspension is expired if:
 * - banned = true
 * - ban_expires_at is not null
 * - ban_expires_at < current timestamp
 *
 * @returns The number of suspensions that were revoked
 */
export async function revokeExpiredSuspensions(): Promise<number> {
  try {
    const now = new Date().toISOString();
    console.log(
      "[revokeExpiredSuspensions] Checking for expired suspensions at:",
      now
    );

    // Find all users with expired suspensions
    // First, get all banned users with ban_expires_at set
    const { data: allSuspendedUsers, error: fetchAllError } =
      await supabaseAdmin
        .from("users")
        .select("id, ban_expires_at")
        .eq("banned", true)
        .not("ban_expires_at", "is", null);

    if (fetchAllError) {
      console.error("Error fetching suspended users:", fetchAllError);
      return 0;
    }

    console.log(
      "[revokeExpiredSuspensions] Found suspended users:",
      allSuspendedUsers?.length || 0
    );

    // Filter expired suspensions in JavaScript (more reliable than SQL comparison)
    const expiredUsers = (allSuspendedUsers || []).filter((user) => {
      if (!user.ban_expires_at) return false;
      const expiryDate = new Date(user.ban_expires_at);
      const nowDate = new Date();
      const isExpired = expiryDate < nowDate;
      if (isExpired) {
        console.log(
          `[revokeExpiredSuspensions] User ${user.id} expired: ${user.ban_expires_at} < ${now}`
        );
      }
      return isExpired;
    });

    if (expiredUsers.length === 0) {
      console.log("[revokeExpiredSuspensions] No expired suspensions found");
      return 0;
    }

    console.log(
      `[revokeExpiredSuspensions] Found ${expiredUsers.length} expired suspension(s)`
    );

    // Revoke all expired suspensions
    const userIds = expiredUsers.map((user) => user.id);
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        banned: false,
        ban_reason: null,
        ban_expires_at: null,
      })
      .in("id", userIds);

    if (updateError) {
      console.error("Error revoking expired suspensions:", updateError);
      return 0;
    }

    console.log(
      `Automatically revoked ${expiredUsers.length} expired suspension(s)`
    );
    return expiredUsers.length;
  } catch (error) {
    console.error("Unexpected error in revokeExpiredSuspensions:", error);
    return 0;
  }
}

/**
 * Checks and revokes expired suspensions for a specific user.
 * Useful when fetching a single user's data.
 *
 * @param userId - The user ID to check
 * @returns true if the suspension was revoked, false otherwise
 */
export async function revokeExpiredSuspensionForUser(
  userId: string
): Promise<boolean> {
  try {
    console.log(`[revokeExpiredSuspensionForUser] Checking user ${userId}`);

    // Get the user's ban status
    const { data: user, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, banned, ban_expires_at")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError) {
      console.error(`Error fetching user ${userId}:`, fetchError);
      return false;
    }

    if (!user || !user.banned || !user.ban_expires_at) {
      console.log(
        `[revokeExpiredSuspensionForUser] User ${userId} is not suspended or has no expiry date`
      );
      return false;
    }

    // Check if expired
    const expiryDate = new Date(user.ban_expires_at);
    const now = new Date();

    if (expiryDate >= now) {
      console.log(
        `[revokeExpiredSuspensionForUser] User ${userId} suspension not expired yet: ${user.ban_expires_at}`
      );
      return false;
    }

    console.log(
      `[revokeExpiredSuspensionForUser] User ${userId} suspension expired: ${user.ban_expires_at} < ${now.toISOString()}`
    );

    // Revoke the expired suspension
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        banned: false,
        ban_reason: null,
        ban_expires_at: null,
      })
      .eq("id", userId);

    if (updateError) {
      console.error(
        `Error revoking expired suspension for user ${userId}:`,
        updateError
      );
      return false;
    }

    console.log(
      `[revokeExpiredSuspensionForUser] Successfully revoked suspension for user ${userId}`
    );
    return true;
  } catch (error) {
    console.error(
      `Unexpected error revoking suspension for user ${userId}:`,
      error
    );
    return false;
  }
}
