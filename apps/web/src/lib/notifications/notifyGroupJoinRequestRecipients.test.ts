import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();
const mockCreateNotification = vi.fn();

vi.mock("@kovari/api", () => ({
  createAdminSupabaseClient: () => ({
    from: (...args: unknown[]) => mockFrom(...args),
  }),
}));

vi.mock("@/lib/notifications/createNotification", () => ({
  createNotification: (...args: unknown[]) => mockCreateNotification(...args),
}));

import {
  resolveGroupJoinRequestRecipientIds,
  notifyGroupJoinRequestRecipients,
} from "@/lib/notifications/notifyGroupJoinRequestRecipients";
import { NotificationType } from "@kovari/types";

function buildSupabaseMock(options: {
  creatorId?: string | null;
  adminUserIds?: string[];
  groupName?: string;
  requesterName?: string;
}) {
  mockFrom.mockImplementation((table: string) => {
    if (table === "groups") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                creator_id: options.creatorId ?? "creator-uuid",
                name: options.groupName ?? "Paris Trip",
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
              eq: vi.fn().mockResolvedValue({
                data: (options.adminUserIds ?? ["admin-uuid"]).map((user_id) => ({
                  user_id,
                })),
              }),
            }),
          }),
        }),
      };
    }
    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { name: options.requesterName ?? "Alex" },
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

describe("notifyGroupJoinRequestRecipients (BUG-G2b RC-1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateNotification.mockResolvedValue({ success: true, notificationId: "n1" });
  });

  it("resolves creator and admins, excluding the requester", async () => {
    buildSupabaseMock({
      creatorId: "creator-uuid",
      adminUserIds: ["creator-uuid", "other-admin-uuid"],
    });

    const recipients = await resolveGroupJoinRequestRecipientIds(
      "group-1",
      "requester-uuid",
    );

    expect(recipients.sort()).toEqual(
      ["creator-uuid", "other-admin-uuid"].sort(),
    );
    expect(recipients).not.toContain("requester-uuid");
  });

  it("creates exactly one GROUP_JOIN_REQUEST_RECEIVED notification per recipient", async () => {
    buildSupabaseMock({
      creatorId: "creator-uuid",
      adminUserIds: ["creator-uuid", "admin-2"],
      groupName: "Tokyo Squad",
      requesterName: "Sam",
    });

    await notifyGroupJoinRequestRecipients("group-1", "requester-uuid");

    expect(mockCreateNotification).toHaveBeenCalledTimes(2);
    for (const call of mockCreateNotification.mock.calls) {
      expect(call[0]).toMatchObject({
        type: NotificationType.GROUP_JOIN_REQUEST_RECEIVED,
        entityType: "group",
        entityId: "group-1",
        title: "Join Request",
        message: "Sam wants to join Tokyo Squad",
      });
    }
  });

  it("does not notify when requester is the only eligible recipient", async () => {
    buildSupabaseMock({
      creatorId: "requester-uuid",
      adminUserIds: ["requester-uuid"],
    });

    await notifyGroupJoinRequestRecipients("group-1", "requester-uuid");

    expect(mockCreateNotification).not.toHaveBeenCalled();
  });
});
