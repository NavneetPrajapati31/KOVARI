import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationType } from "@kovari/types";

const NOTIFICATION_SOCKET_CHANNEL = "notifications:new_notification";

const mockPublish = vi.fn();
const mockConnectRedis = vi.fn();

vi.mock("@kovari/api", () => ({
  NOTIFICATION_SOCKET_CHANNEL: "notifications:new_notification",
}));

vi.mock("@/services/socket/redis", () => ({
  connectRedis: (...args: unknown[]) => mockConnectRedis(...args),
  pubClient: {
    get isOpen() {
      return true;
    },
    publish: (...args: unknown[]) => mockPublish(...args),
  },
}));

import { emitRealtimeNotification } from "./emitRealtimeNotification";

const ADMIN_UUID = "550e8400-e29b-41d4-a716-446655440000";

describe("emitRealtimeNotification (BUG-G2b delivery fix)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectRedis.mockResolvedValue(true);
    mockPublish.mockResolvedValue(1);
  });

  it("publishes payload with both clerkUserId and userId for dual-room fan-out", async () => {
    const ok = await emitRealtimeNotification({
      clerkUserId: "user_admin_clerk",
      userId: ADMIN_UUID,
      notificationId: "notif-1",
      type: NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
      title: "Join Request",
      message: "Alex wants to join Paris Trip",
      entityType: "group",
      entityId: "group-123",
    });

    expect(ok).toBe(true);
    const payload = JSON.parse(mockPublish.mock.calls[0][1] as string);
    expect(payload.clerkUserId).toBe("user_admin_clerk");
    expect(payload.userId).toBe(ADMIN_UUID);
    expect(payload.type).toBe(NotificationType.GROUP_JOIN_REQUEST_RECEIVED);
    expect(payload.entity_type).toBe("group");
    expect(payload.entity_id).toBe("group-123");
  });

  it("publishes with UUID only when clerk id is missing (mobile-only recipient)", async () => {
    const ok = await emitRealtimeNotification({
      userId: ADMIN_UUID,
      notificationId: "notif-2",
      type: NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
      title: "Join Request",
      message: "Someone wants to join",
      entityType: "group",
      entityId: "group-456",
    });

    expect(ok).toBe(true);
    const payload = JSON.parse(mockPublish.mock.calls[0][1] as string);
    expect(payload.clerkUserId).toBeNull();
    expect(payload.userId).toBe(ADMIN_UUID);
  });

  it("includes chatId for chat entity notifications (backward compatible)", async () => {
    await emitRealtimeNotification({
      clerkUserId: "user_chat",
      userId: ADMIN_UUID,
      notificationId: "notif-3",
      type: NotificationType.NEW_MESSAGE,
      title: "New message",
      message: "Hello",
      entityType: "chat",
      entityId: "chat-room-abc",
    });

    const payload = JSON.parse(mockPublish.mock.calls[0][1] as string);
    expect(payload.chatId).toBe("chat-room-abc");
    expect(payload.entity_type).toBe("chat");
  });

  it("returns false when both clerkUserId and userId are missing", async () => {
    const ok = await emitRealtimeNotification({
      clerkUserId: "",
      userId: null,
      notificationId: "notif-4",
      type: NotificationType.GROUP_INVITE_RECEIVED,
      title: "Invite",
      message: "Join us",
      entityType: "group",
      entityId: "group-789",
    });

    expect(ok).toBe(false);
    expect(mockPublish).not.toHaveBeenCalled();
  });
});
