import {
  Notification,
  NotificationType,
  EntityType,
} from "@/shared/types/notifications";

/**
 * Get the navigation link for a notification based on its entity type
 */
export function getNotificationLink(notification: Notification): string {
  const { entity_type, entity_id, type } = notification;

  if (!entity_id) {
    return "/notifications";
  }

  switch (entity_type) {
    case "match":
      // For matches, navigate to chat with the matched user
      // entity_id is the match ID, but we need the other user's ID
      // For now, navigate to requests page where they can see the match
      return "/requests";
    case "group":
      if (type === NotificationType.GROUP_JOIN_REQUEST_RECEIVED) {
        return `/groups/${entity_id}/settings/requests`;
      }
      return `/groups/${entity_id}/home`;
    case "chat":
      // entity_id is the sender's user ID
      return `/chat/${entity_id}`;
    default:
      return "/notifications";
  }
}

/**
 * Get avatar fallback text from notification title
 */
export function getAvatarFallback(title: string): string {
  const words = title.split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.substring(0, 2).toUpperCase();
}

/**
 * Determine if notification should show a pool icon instead of avatar
 */
export function shouldShowPoolIcon(notification: Notification): boolean {
  return (
    notification.type === NotificationType.GROUP_INVITE_RECEIVED ||
    notification.type === NotificationType.GROUP_JOIN_APPROVED ||
    notification.type === NotificationType.GROUP_JOIN_REQUEST_RECEIVED
  );
}
