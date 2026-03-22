import { pubClient } from "../socket/redis";
import { createNotification } from "@/lib/notifications/createNotification";
import { NotificationType } from "@/shared/types/notifications";
import { getPushSubscriptions, deletePushSubscription } from "./subscriptions";
import { sendPushNotification } from "./push";

/**
 * Buffers notifications in Redis and aggregates them after a delay.
 * Key: `chat:notify:buffer:{userId}:{chatId}` - stores list of message contents.
 * Key: `chat:notify:timer:{userId}:{chatId}` - flag to indicate a timer is already running.
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

  // Get and clear buffer atomically if possible, otherwise simple fetch
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

  // 1. Create DB Notification
  const result = await createNotification({
    userId,
    type: NotificationType.NEW_MESSAGE,
    title,
    message: body,
    entityType: "chat",
    entityId: senderId, // Use sender UUID (valid UUID)
    imageUrl: senderAvatar || undefined,
  });

  if (!result.success) {
    console.error("[Batching] Error creating DB notification:", result.error);
  }

  // 2. Trigger Web Push (since batching is for offline/not-in-chat users)
  const subscriptions = await getPushSubscriptions(userId);
  for (const sub of subscriptions) {
    const pushResult = await sendPushNotification(sub, {
      title,
      body,
      data: { chatId, url: `/chat/${chatId}` },
      icon: senderAvatar || "/logo.png",
      badge: "/badge.png",
      tag: `chat-${chatId}`, // Overwrite previous notifications for same chat
    });

    if (pushResult.error === "expired") {
      await deletePushSubscription(sub.endpoint);
    }
  }
}
