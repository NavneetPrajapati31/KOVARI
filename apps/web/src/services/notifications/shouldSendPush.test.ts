import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationType } from "@kovari/types";

const mockSCard = vi.fn();
const mockSIsMember = vi.fn();
const mockFrom = vi.fn();

vi.mock("../socket/redis", () => ({
  connectRedis: vi.fn().mockResolvedValue(true),
  pubClient: {
    isOpen: true,
    sCard: (...args: unknown[]) => mockSCard(...args),
    sIsMember: (...args: unknown[]) => mockSIsMember(...args),
  },
}));

vi.mock("@kovari/api", () => ({
  createAdminSupabaseClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
  isActiveBan: () => false,
}));

import { shouldSendPush } from "./shouldSendPush";

function mockUserLookup() {
  mockFrom.mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        maybeSingle: vi.fn().mockResolvedValue({
          data: { banned: false, ban_expires_at: null },
        }),
      }),
    }),
  });
}

describe("shouldSendPush (BUG-G2b RC-3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLookup();
  });

  it("suppresses FCM for GROUP_JOIN_REQUEST_RECEIVED when recipient is online", async () => {
    mockSCard.mockResolvedValue(1);

    const result = await shouldSendPush({
      userId: "user_admin_clerk",
      type: NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
      entityType: "group",
      entityId: "group-123",
    });

    expect(result).toBe(false);
    expect(mockSIsMember).not.toHaveBeenCalled();
  });

  it("allows FCM for GROUP_JOIN_REQUEST_RECEIVED when recipient is offline", async () => {
    mockSCard.mockResolvedValue(0);
    mockFrom.mockImplementation((table: string) => {
      if (table === "users") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { banned: false, ban_expires_at: null },
              }),
              single: vi.fn().mockResolvedValue({
                data: { id: "admin-internal-uuid" },
              }),
            }),
          }),
        };
      }
      if (table === "group_memberships") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { role: "admin" },
                }),
              }),
            }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null }),
          }),
        }),
      };
    });

    const result = await shouldSendPush({
      userId: "user_admin_clerk",
      type: NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
      entityType: "group",
      entityId: "group-123",
    });

    expect(result).toBe(true);
  });

  it("suppresses FCM for MATCH_INTEREST_RECEIVED when recipient is online", async () => {
    mockSCard.mockResolvedValue(2);

    const result = await shouldSendPush({
      userId: "user_recipient",
      type: NotificationType.MATCH_INTEREST_RECEIVED,
      entityType: "match",
      entityId: "user-sender-uuid",
    });

    expect(result).toBe(false);
  });

  it("still suppresses FCM for NEW_MESSAGE when user is viewing the chat room", async () => {
    mockSCard.mockResolvedValue(1);
    mockSIsMember.mockResolvedValue(true);

    const result = await shouldSendPush({
      userId: "user_chat",
      type: NotificationType.NEW_MESSAGE,
      entityType: "chat",
      entityId: "chat-room-1",
    });

    expect(result).toBe(false);
    expect(mockSIsMember).toHaveBeenCalledWith(
      "user_chats:user_chat",
      "chat-room-1",
    );
  });

  it("allows FCM for NEW_MESSAGE when user is online but not in the chat room", async () => {
    mockSCard.mockResolvedValue(1);
    mockSIsMember.mockResolvedValue(false);

    const result = await shouldSendPush({
      userId: "user_chat",
      type: NotificationType.NEW_MESSAGE,
      entityType: "chat",
      entityId: "chat-room-1",
    });

    expect(result).toBe(true);
  });
});
