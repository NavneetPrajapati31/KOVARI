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

const ADMIN_UUID = "550e8400-e29b-41d4-a716-446655440000";
const GROUP_ID = "660e8400-e29b-41d4-a716-446655440001";

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

function mockJoinRequestEligibility(options: {
  isCreator?: boolean;
  role?: string;
  status?: string;
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "users") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                id: ADMIN_UUID,
                banned: false,
                ban_expires_at: null,
                clerk_user_id: "user_admin_clerk",
              },
            }),
          }),
        }),
      };
    }
    if (table === "groups") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                creator_id: options.isCreator ? ADMIN_UUID : "other-creator",
              },
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
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  role: options.role ?? "admin",
                  status: options.status ?? "accepted",
                },
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
}

describe("shouldSendPush (BUG-G2b delivery fix)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserLookup();
  });

  it("suppresses FCM for GROUP_JOIN_REQUEST when UUID socket room is occupied", async () => {
    mockSCard.mockImplementation(async (key: string) => {
      if (key === `user_socket:${ADMIN_UUID}`) return 1;
      return 0;
    });
    mockJoinRequestEligibility({ isCreator: true });

    const result = await shouldSendPush({
      userId: "user_admin_clerk",
      clerkId: "user_admin_clerk",
      supabaseId: ADMIN_UUID,
      type: NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
      entityType: "group",
      entityId: GROUP_ID,
    });

    expect(result).toBe(false);
    expect(mockSCard).toHaveBeenCalledWith(`user_socket:${ADMIN_UUID}`);
  });

  it("allows FCM when mobile UUID room is empty even if clerk room is occupied", async () => {
    mockSCard.mockImplementation(async (key: string) => {
      if (key === "user_socket:user_admin_clerk") return 1;
      if (key === `user_socket:${ADMIN_UUID}`) return 0;
      return 0;
    });
    mockJoinRequestEligibility({ isCreator: true });

    const result = await shouldSendPush({
      userId: "user_admin_clerk",
      clerkId: "user_admin_clerk",
      supabaseId: ADMIN_UUID,
      type: NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
      entityType: "group",
      entityId: GROUP_ID,
    });

    expect(result).toBe(true);
  });

  it("allows FCM for clerk-less mobile user when UUID room is empty", async () => {
    mockSCard.mockResolvedValue(0);
    mockJoinRequestEligibility({ isCreator: true });

    const result = await shouldSendPush({
      userId: ADMIN_UUID,
      clerkId: null,
      supabaseId: ADMIN_UUID,
      type: NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
      entityType: "group",
      entityId: GROUP_ID,
    });

    expect(result).toBe(true);
  });

  it("allows FCM for group creator without admin/owner membership role", async () => {
    mockSCard.mockResolvedValue(0);
    mockJoinRequestEligibility({ isCreator: true, role: "member" });

    const result = await shouldSendPush({
      userId: ADMIN_UUID,
      supabaseId: ADMIN_UUID,
      type: NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
      entityType: "group",
      entityId: GROUP_ID,
    });

    expect(result).toBe(true);
  });

  it("denies FCM for non-creator non-admin on join request", async () => {
    mockSCard.mockResolvedValue(0);
    mockJoinRequestEligibility({
      isCreator: false,
      role: "member",
      status: "accepted",
    });

    const result = await shouldSendPush({
      userId: ADMIN_UUID,
      supabaseId: ADMIN_UUID,
      type: NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
      entityType: "group",
      entityId: GROUP_ID,
    });

    expect(result).toBe(false);
  });

  it("suppresses FCM for MATCH_INTEREST when deliverable socket room exists", async () => {
    mockSCard.mockResolvedValue(1);

    const result = await shouldSendPush({
      userId: "user_recipient",
      clerkId: "user_recipient",
      supabaseId: "770e8400-e29b-41d4-a716-446655440002",
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
