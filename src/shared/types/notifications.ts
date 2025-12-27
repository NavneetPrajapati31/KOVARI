export enum NotificationType {
  MATCH_INTEREST_RECEIVED = "MATCH_INTEREST_RECEIVED",
  MATCH_ACCEPTED = "MATCH_ACCEPTED",
  GROUP_INVITE_RECEIVED = "GROUP_INVITE_RECEIVED",
  GROUP_JOIN_REQUEST_RECEIVED = "GROUP_JOIN_REQUEST_RECEIVED",
  GROUP_JOIN_APPROVED = "GROUP_JOIN_APPROVED",
  NEW_MESSAGE = "NEW_MESSAGE",
  REPORT_SUBMITTED = "REPORT_SUBMITTED",
}

export type EntityType = "match" | "group" | "chat" | null;

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  entity_type: EntityType;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: EntityType;
  entityId?: string;
}
