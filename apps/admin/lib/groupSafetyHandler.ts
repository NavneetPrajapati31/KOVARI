// apps/admin/lib/groupSafetyHandler.ts
import { supabaseAdmin } from "./supabaseAdmin";
import { logAdminAction } from "./logAdminAction";

/**
 * Categorizes removal reason into severity levels
 */
export type RemovalSeverity = "hard-remove" | "warn-review";

export function categorizeRemovalReason(reason: string): RemovalSeverity {
  const lowerReason = reason.toLowerCase();

  // Hard-remove indicators
  const hardRemoveKeywords = [
    "fake",
    "fraud",
    "fraudulent",
    "scam",
    "unsafe",
    "dangerous",
    "illegal",
    "repeated flags",
    "multiple flags",
    "spam",
    "phishing",
  ];

  // Check for hard-remove keywords
  for (const keyword of hardRemoveKeywords) {
    if (lowerReason.includes(keyword)) {
      return "hard-remove";
    }
  }

  // Default to warn-review for minor violations
  return "warn-review";
}

/**
 * Gets the count of removed groups for an organizer
 */
export async function getOrganizerRemovalCount(
  organizerId: string
): Promise<number> {
  // Count groups where creator_id = organizerId and status = 'removed'
  const { count: removedGroupsCount, error: groupsError } = await supabaseAdmin
    .from("groups")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", organizerId)
    .eq("status", "removed");

  if (groupsError) {
    console.error("Error counting removed groups:", groupsError);
    return 0;
  }

  return removedGroupsCount || 0;
}

/**
 * Handles organizer trust impact when a group is removed
 * - Increments internal trust penalty (tracked via admin_actions metadata)
 * - Auto-flags user for review if repeated removals
 */
export async function handleOrganizerTrustImpact(
  organizerId: string,
  severity: RemovalSeverity,
  adminId: string,
  groupId: string
): Promise<void> {
  try {
    // Get current removal count
    const removalCount = await getOrganizerRemovalCount(organizerId);

    // Calculate trust penalty increment
    // Hard-remove = 3 points, warn-review = 1 point
    const penaltyIncrement = severity === "hard-remove" ? 3 : 1;
    const newRemovalCount = removalCount + 1;

    // Auto-flag threshold: 3+ removals
    const AUTO_FLAG_THRESHOLD = 3;

    // Check if we should auto-flag the user
    if (newRemovalCount >= AUTO_FLAG_THRESHOLD) {
      // Check if user is already flagged for admin review
      const { data: existingFlags, error: flagsError } = await supabaseAdmin
        .from("user_flags")
        .select("id")
        .eq("user_id", organizerId)
        .ilike("reason", "%admin review%")
        .eq("status", "pending")
        .limit(1);

      if (flagsError) {
        console.error("Error checking existing flags:", flagsError);
      }

      // Create auto-flag if not already flagged
      if (!existingFlags || existingFlags.length === 0) {
        const { error: flagError } = await supabaseAdmin
          .from("user_flags")
          .insert({
            user_id: organizerId,
            reporter_id: null, // System-generated
            type: "abuse", // Using existing flag type
            reason: `Auto-flagged: ${newRemovalCount} group removal(s). Requires admin review.`,
            status: "pending",
            evidence_url: null,
          });

        if (flagError) {
          console.error("Error creating auto-flag:", flagError);
        } else {
          // Log the auto-flag action
          await logAdminAction({
            adminId,
            targetType: "user",
            targetId: organizerId,
            action: "auto_flag_user",
            reason: `Auto-flagged due to ${newRemovalCount} group removal(s)`,
            metadata: {
              removalCount: newRemovalCount,
              severity,
              autoFlagged: true,
            },
          });
        }
      }
    }

    // Log trust penalty increment in metadata
    await logAdminAction({
      adminId,
      targetType: "group",
      targetId: groupId,
      action: "group_remove_trust_impact",
      reason: `Organizer trust penalty: +${penaltyIncrement} (Total removals: ${newRemovalCount})`,
      metadata: {
        organizerId,
        severity,
        penaltyIncrement,
        removalCount: newRemovalCount,
        autoFlagged: newRemovalCount >= AUTO_FLAG_THRESHOLD,
      },
    });
  } catch (error) {
    console.error("Error handling organizer trust impact:", error);
    // Don't throw - this is a side effect, shouldn't block the main action
  }
}
