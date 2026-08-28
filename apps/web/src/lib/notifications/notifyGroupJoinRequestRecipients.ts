import { createAdminSupabaseClient } from "@kovari/api";
import { NotificationType } from "@kovari/types";
import { createNotification } from "@/lib/notifications/createNotification";

/**
 * Resolves group admins/creator who should receive GROUP_JOIN_REQUEST_RECEIVED.
 * Server-side only — never accepts client-supplied recipient ids.
 */
export async function resolveGroupJoinRequestRecipientIds(
  groupId: string,
  requesterUserId: string,
): Promise<string[]> {
  const supabase = createAdminSupabaseClient();

  const { data: group } = await supabase
    .from("groups")
    .select("creator_id")
    .eq("id", groupId)
    .maybeSingle();

  const recipientIds = new Set<string>();

  if (group?.creator_id && group.creator_id !== requesterUserId) {
    recipientIds.add(group.creator_id);
  }

  const { data: adminMemberships } = await supabase
    .from("group_memberships")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("status", "accepted")
    .eq("role", "admin");

  for (const membership of adminMemberships ?? []) {
    if (membership.user_id !== requesterUserId) {
      recipientIds.add(membership.user_id);
    }
  }

  return [...recipientIds];
}

/**
 * Creates one GROUP_JOIN_REQUEST_RECEIVED notification per eligible recipient.
 */
export async function notifyGroupJoinRequestRecipients(
  groupId: string,
  requesterUserId: string,
): Promise<void> {
  const supabase = createAdminSupabaseClient();

  const [{ data: group }, { data: requesterProfile }] = await Promise.all([
    supabase.from("groups").select("name").eq("id", groupId).maybeSingle(),
    supabase
      .from("profiles")
      .select("name")
      .eq("user_id", requesterUserId)
      .maybeSingle(),
  ]);

  const requesterName = requesterProfile?.name || "Someone";
  const groupName = group?.name || "your group";
  const recipientIds = await resolveGroupJoinRequestRecipientIds(
    groupId,
    requesterUserId,
  );

  if (recipientIds.length === 0) {
    return;
  }

  await Promise.all(
    recipientIds.map((recipientId) =>
      createNotification({
        userId: recipientId,
        type: NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
        title: "Join Request",
        message: `${requesterName} wants to join ${groupName}`,
        entityType: "group",
        entityId: groupId,
        data: {
          senderId: requesterUserId,
          actorId: requesterUserId,
        },
      }),
    ),
  );
}
