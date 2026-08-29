import { NotificationType } from "@kovari/types";

/**
 * Notification types delivered to online clients via the centralized
 * createNotification → Redis → Socket.IO `new_notification` pipeline.
 * FCM is suppressed for these types when the recipient is online (RC-3).
 */
export const REALTIME_SOCKET_DELIVERED_TYPES: ReadonlySet<NotificationType> =
  new Set([
    NotificationType.MATCH_INTEREST_RECEIVED,
    NotificationType.MATCH_ACCEPTED,
    NotificationType.GROUP_INVITE_RECEIVED,
    NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
    NotificationType.GROUP_JOIN_APPROVED,
  ]);

/**
 * Unique Socket.IO room ids for `new_notification` fan-out.
 * Web joins `user_socket:{clerkId}`; mobile joins `user_socket:{supabaseUuid}`.
 */
export function notificationSocketRoomIds(
  clerkUserId?: string | null,
  userId?: string | null,
): string[] {
  const rooms = new Set<string>();
  const clerk = clerkUserId?.trim();
  const uuid = userId?.trim();
  if (clerk) rooms.add(clerk);
  if (uuid) rooms.add(uuid);
  return [...rooms];
}

export interface RealtimeNotificationSocketPayload {
  /** Clerk user id — socket room `user_socket:{clerkUserId}` (web) */
  clerkUserId?: string | null;
  /** Supabase UUID — socket room `user_socket:{userId}` (mobile JWT sub) */
  userId?: string | null;
  id: string;
  type: string;
  title: string;
  message: string;
  entity_type?: string | null;
  entity_id?: string | null;
  /** Present for chat/message alerts; legacy web hook reads this field. */
  chatId?: string | null;
  image_url?: string | null;
  created_at: string;
}
