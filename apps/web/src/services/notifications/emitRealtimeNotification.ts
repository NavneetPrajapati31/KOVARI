import { NOTIFICATION_SOCKET_CHANNEL } from "@kovari/api";
import { EntityType, NotificationType } from "@kovari/types";
import { connectRedis, pubClient } from "@/services/socket/redis";
import {
  notificationSocketRoomIds,
  RealtimeNotificationSocketPayload,
} from "./realtimeNotificationTypes";

export interface EmitRealtimeNotificationParams {
  clerkUserId?: string | null;
  /** Internal Supabase UUID — required for mobile `user_socket:{uuid}` delivery */
  userId?: string | null;
  notificationId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: EntityType | null;
  entityId?: string | null;
  imageUrl?: string | null;
  createdAt?: string;
}

/**
 * Publishes a realtime notification event to Redis for the Socket.IO server
 * to fan out as `new_notification` to Clerk and/or UUID socket rooms.
 *
 * Called centrally from createNotification() — never from individual API routes.
 */
export async function emitRealtimeNotification(
  params: EmitRealtimeNotificationParams,
): Promise<boolean> {
  const {
    clerkUserId,
    userId,
    notificationId,
    type,
    title,
    message,
    entityType = null,
    entityId = null,
    imageUrl = null,
    createdAt,
  } = params;

  const rooms = notificationSocketRoomIds(clerkUserId, userId);
  if (rooms.length === 0) {
    console.warn(
      "[RealtimeNotification] Missing clerkUserId and userId — skipping emit",
    );
    return false;
  }

  const connected = await connectRedis();
  if (!connected || !pubClient.isOpen) {
    console.warn("[RealtimeNotification] Redis unavailable — skipping emit");
    return false;
  }

  const payload: RealtimeNotificationSocketPayload = {
    clerkUserId: clerkUserId?.trim() || null,
    userId: userId?.trim() || null,
    id: notificationId,
    type,
    title,
    message,
    entity_type: entityType,
    entity_id: entityId,
    chatId: entityType === "chat" && entityId ? entityId : null,
    image_url: imageUrl,
    created_at: createdAt ?? new Date().toISOString(),
  };

  try {
    await pubClient.publish(
      NOTIFICATION_SOCKET_CHANNEL,
      JSON.stringify(payload),
    );
    return true;
  } catch (err) {
    console.error("[RealtimeNotification] Redis publish failed:", err);
    return false;
  }
}
