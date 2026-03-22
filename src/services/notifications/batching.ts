import { pubClient } from "../socket/redis";
import { 
  NotificationType, 
} from "@/shared/types/notifications";
import { createNotification } from "@/lib/notifications/createNotification";

/**
 * Buffers notifications to avoid spamming the user with multiple alerts
 */
export async function bufferNotification(
  userId: string,
  chatId: string,
  senderName: string,
  senderAvatar: string,
  messagePreview: string,
  senderId: string
) {
  const bufferKey = `chat:notify:buffer:${userId}:${chatId}`;
  const timerKey = `chat:notify:timer:${userId}:${chatId}`;

  try {
    // Add message to buffer
    await pubClient.rPush(bufferKey, messagePreview);
    
    // Check if timer is already running
    const timerExists = await pubClient.get(timerKey);
    if (timerExists) return;

    // Start timer (10 seconds)
    await pubClient.set(timerKey, "true", { EX: 15 }); // 15s safety expiry

    setTimeout(async () => {
      try {
        await processBuffer(userId, chatId, senderName, senderAvatar, senderId);
      } catch (err) {
        console.error("[Batching] Error in setTimeout processBuffer:", err);
      }
    }, 10000);

  } catch (err) {
    console.error("[Batching] Error buffering notification:", err);
  }
}

async function processBuffer(userId: string, chatId: string, senderName: string, senderAvatar: string, senderId: string) {
  const bufferKey = `chat:notify:buffer:${userId}:${chatId}`;
  const timerKey = `chat:notify:timer:${userId}:${chatId}`;

  // Get and clear buffer atomically
  const messages = await pubClient.lRange(bufferKey, 0, -1);
  if (!messages || messages.length === 0) {
    await pubClient.del(timerKey);
    return;
  }

  // Clear buffer and timer
  await pubClient.del(bufferKey);
  await pubClient.del(timerKey);

  console.log(`[Batching] Processing buffer for user: ${userId}, chat: ${chatId}. Messages: ${messages.length}, senderName: ${senderName}, senderId: ${senderId}`);

  const count = messages.length;
  const title = count > 1 ? `${senderName} sent ${count} messages` : `New message from ${senderName}`;
  const body = count > 1 ? `Latest: ${messages[count-1]}` : messages[0];

  // 1. Create DB Notification (This now automatically handles push evaluation and priority)
  const result = await createNotification({
    userId,
    type: NotificationType.NEW_MESSAGE,
    title,
    message: body,
    entityType: "chat",
    entityId: senderId, 
    imageUrl: senderAvatar || undefined,
  });

  if (!result.success) {
    console.error("[Batching] Error creating notification:", result.error);
  }
}
