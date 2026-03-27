import {
  Notification,
  NotificationType,
} from "@kovari/types";

export function getNotificationLink(notification: Notification): string {
  const { entity_type, entity_id, type } = notification;

  if (type === NotificationType.REPORT_SUBMITTED) {
    return "/safety";
  }

  if (!entity_id) {
    return "/notifications";
  }

  switch (entity_type) {
    case "match":
      if (type === NotificationType.MATCH_ACCEPTED) {
        return `/chat/${entity_id}`;
      }
      return "/requests";
    case "group":
      if (type === NotificationType.GROUP_JOIN_REQUEST_RECEIVED) {
        return `/groups/${entity_id}/settings?tab=requests`;
      } else if (type === NotificationType.GROUP_INVITE_RECEIVED) {
        return `/requests?tab=invitations`;
      }
      return `/groups/${entity_id}/home`;
    case "chat":
      return `/chat/${entity_id}`;
    default:
      return "/notifications";
  }
}

const NON_NAME_FIRST_WORDS = new Set([
  "you", "your", "a", "an", "the", "new", "reminder",
]);

function getInitialFromMessage(message: string): string | null {
  const trimmed = message.trim();
  if (!trimmed) return null;
  const words = trimmed.split(/\s+/);
  const first = words[0]?.trim();
  if (!first || first.length === 0) return null;
  const lower = first.toLowerCase();
  if (NON_NAME_FIRST_WORDS.has(lower)) {
    const second = words[1]?.trim();
    if (second && second.length > 0) return second[0].toUpperCase();
    return null;
  }
  return first[0].toUpperCase();
}

export function getAvatarFallback(notification: Notification): string {
  const personInitial =
    notification.message && getInitialFromMessage(notification.message);
  if (personInitial) return personInitial;

  const title = notification.title;
  const words = title.split(" ");
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return title.substring(0, 2).toUpperCase();
}

export function shouldShowPoolIcon(notification: Notification): boolean {
  return (
    notification.type === NotificationType.GROUP_INVITE_RECEIVED ||
    notification.type === NotificationType.GROUP_JOIN_APPROVED ||
    notification.type === NotificationType.GROUP_JOIN_REQUEST_RECEIVED
  );
}
