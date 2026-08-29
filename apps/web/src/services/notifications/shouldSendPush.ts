import { 
  NotificationPriority, 
  NotificationPriorityMap, 
  NotificationType, 
  EntityType 
} from "@kovari/types";
import { pubClient, connectRedis } from "../socket/redis";
import { createAdminSupabaseClient, isActiveBan } from "@kovari/api";
import {
  REALTIME_SOCKET_DELIVERED_TYPES,
} from "./realtimeNotificationTypes";

interface ShouldSendPushParams {
  userId: string;
  clerkId?: string | null;
  supabaseId?: string | null;
  type: NotificationType;
  entityId?: string | null;
  entityType?: EntityType;
}

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

/**
 * Room-aware push suppression engine.
 *
 * Decision tree:
 *   LOW priority            → suppress always
 *   User offline            → send
 *   User online + in chat   → suppress (already looking at the conversation)
 *   User online + elsewhere → send    (user won't see the message otherwise)
 *   Match/request/group transactional: suppress FCM only if a socket exists
 *     in a room we actually emit to (Clerk and/or UUID).
 */
export async function shouldSendPush({
  userId,
  clerkId,
  supabaseId,
  type,
  entityId,
  entityType,
}: ShouldSendPushParams): Promise<boolean> {
  await connectRedis();

  const supabase = createAdminSupabaseClient();
  const { data: userRow } = UUID_REGEX.test(userId)
    ? await supabase.from("users").select("banned, ban_expires_at").eq("id", userId).maybeSingle()
    : await supabase.from("users").select("banned, ban_expires_at").eq("clerk_user_id", userId).maybeSingle();

  if (userRow && isActiveBan(userRow)) {
    return false;
  }

  const priority = NotificationPriorityMap[type] || NotificationPriority.LOW;

  // 1. Low priority — never push regardless of presence
  if (priority === NotificationPriority.LOW) return false;

  // 2a. Realtime-delivered types: suppress FCM only when a deliverable socket room is occupied.
  if (REALTIME_SOCKET_DELIVERED_TYPES.has(type)) {
    const canDeliverViaSocket = await hasDeliverableRealtimeSocket({
      userId,
      clerkId,
      supabaseId,
    });
    if (canDeliverViaSocket) return false;
  } else {
    // 2b. Chat/message presence (NEW_MESSAGE and other non-realtime types)
    const userSocketsKey = `user_socket:${userId}`;
    const isOnlineCount = await pubClient.sCard(userSocketsKey);
    const isOnline = isOnlineCount > 0;

    if (isOnline) {
      if ((entityType === "chat" || entityType === "group") && entityId) {
        const activeChatsKey = `user_chats:${userId}`;
        const isViewingTargetRoom = await pubClient.sIsMember(activeChatsKey, entityId);

        if (isViewingTargetRoom) {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  // 3. HIGH priority — always eligible if we reached here
  if (priority === NotificationPriority.HIGH) return true;

  // 4. MEDIUM priority — apply entity-specific rules
  if (priority === NotificationPriority.MEDIUM) {
    if (
      type === NotificationType.GROUP_JOIN_REQUEST_RECEIVED &&
      entityType === "group" &&
      entityId
    ) {
      return isEligibleJoinRequestRecipient(userId, entityId);
    }

    return true;
  }

  return false;
}

async function hasDeliverableRealtimeSocket(params: {
  userId: string;
  clerkId?: string | null;
  supabaseId?: string | null;
}): Promise<boolean> {
  let clerkId = params.clerkId?.trim() || null;
  let supabaseId = params.supabaseId?.trim() || null;

  if (!clerkId && !supabaseId) {
    if (UUID_REGEX.test(params.userId)) {
      supabaseId = params.userId;
    } else {
      clerkId = params.userId;
    }
  }

  if (!clerkId || !supabaseId) {
    const supabase = createAdminSupabaseClient();
    if (supabaseId && !clerkId) {
      const { data } = await supabase
        .from("users")
        .select("clerk_user_id")
        .eq("id", supabaseId)
        .maybeSingle();
      clerkId = data?.clerk_user_id || null;
    } else if (clerkId && !supabaseId) {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("clerk_user_id", clerkId)
        .maybeSingle();
      supabaseId = data?.id || null;
    }
  }

  // Mobile connects on `user_socket:{supabaseUuid}`. Suppress FCM when that room
  // is occupied so we do not duplicate delivery to an active mobile session.
  if (supabaseId) {
    const mobileSocketCount = await pubClient.sCard(`user_socket:${supabaseId}`);
    if (mobileSocketCount > 0) return true;
    // Dual-identity user with mobile offline: web may be online on the Clerk
    // room, but FCM must still reach the device — do not suppress here.
    return false;
  }

  // Clerk-only / web-only recipient (no Supabase UUID on record).
  if (clerkId) {
    const webSocketCount = await pubClient.sCard(`user_socket:${clerkId}`);
    return webSocketCount > 0;
  }

  return false;
}

/**
 * FCM eligibility for GROUP_JOIN_REQUEST_RECEIVED: accepted admin/owner
 * membership OR group creator.
 */
async function isEligibleJoinRequestRecipient(
  userId: string,
  groupId: string,
): Promise<boolean> {
  const supabase = createAdminSupabaseClient();

  const userQuery = supabase.from("users").select("id");
  const { data: user } = UUID_REGEX.test(userId)
    ? await userQuery.eq("id", userId).maybeSingle()
    : await userQuery.eq("clerk_user_id", userId).maybeSingle();

  if (!user?.id) return false;

  const { data: group } = await supabase
    .from("groups")
    .select("creator_id")
    .eq("id", groupId)
    .maybeSingle();

  if (group?.creator_id === user.id) return true;

  const { data: membership } = await supabase
    .from("group_memberships")
    .select("role, status")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    membership?.status === "accepted" &&
    (membership.role === "admin" || membership.role === "owner")
  );
}
