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

describe("emitRealtimeNotification (BUG-G2b RC-2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConnectRedis.mockResolvedValue(true);
    mockPublish.mockResolvedValue(1);
  });

  it("publishes GROUP_JOIN_REQUEST_RECEIVED payload to Redis channel", async () => {
    const ok = await emitRealtimeNotification({
      clerkUserId: "user_admin_clerk",
      notificationId: "notif-1",
      type: NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
      title: "Join Request",
      message: "Alex wants to join Paris Trip",
      entityType: "group",
      entityId: "group-123",
    });

    expect(ok).toBe(true);
    expect(mockPublish).toHaveBeenCalledTimes(1);
    expect(mockPublish.mock.calls[0][0]).toBe(NOTIFICATION_SOCKET_CHANNEL);

    const payload = JSON.parse(mockPublish.mock.calls[0][1] as string);
    expect(payload.clerkUserId).toBe("user_admin_clerk");
    expect(payload.type).toBe(NotificationType.GROUP_JOIN_REQUEST_RECEIVED);
    expect(payload.entity_type).toBe("group");
    expect(payload.entity_id).toBe("group-123");
    expect(payload.id).toBe("notif-1");
  });

  it("includes chatId for chat entity notifications (backward compatible)", async () => {
    await emitRealtimeNotification({
      clerkUserId: "user_chat",
      notificationId: "notif-2",
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

  it("returns false when clerkUserId is missing", async () => {
    const ok = await emitRealtimeNotification({
      clerkUserId: "",
      notificationId: "notif-3",
      type: NotificationType.GROUP_INVITE_RECEIVED,
      title: "Invite",
      message: "Join us",
      entityType: "group",
      entityId: "group-456",
    });

    expect(ok).toBe(false);
    expect(mockPublish).not.toHaveBeenCalled();
  });
});
