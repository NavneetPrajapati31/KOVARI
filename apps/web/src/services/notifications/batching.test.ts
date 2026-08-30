import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotificationType } from "@kovari/types";

const mockRPush = vi.fn();
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockDel = vi.fn();
const mockLRange = vi.fn();
const mockSCard = vi.fn();
const mockFetch = vi.fn();

vi.mock("../socket/redis", () => ({
  pubClient: {
    rPush: (...args: unknown[]) => mockRPush(...args),
    get: (...args: unknown[]) => mockGet(...args),
    set: (...args: unknown[]) => mockSet(...args),
    del: (...args: unknown[]) => mockDel(...args),
    lRange: (...args: unknown[]) => mockLRange(...args),
    sCard: (...args: unknown[]) => mockSCard(...args),
  },
}));

vi.mock("@kovari/api", () => ({
  createAdminSupabaseClient: () => ({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "770e8400-e29b-41d4-a716-446655440002" },
          }),
        }),
      }),
    }),
  }),
}));

vi.stubGlobal("fetch", mockFetch);

import { bufferNotification } from "./batching";

describe("bufferNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRPush.mockResolvedValue(1);
    mockGet.mockResolvedValue(null);
    mockSet.mockResolvedValue("OK");
    mockDel.mockResolvedValue(1);
    mockLRange.mockResolvedValue(["hello"]);
    mockFetch.mockResolvedValue({ ok: true, text: async () => "" });
    process.env.INTERNAL_NOTIFY_SECRET = "test-secret";
    process.env.WEB_BASE_URL = "https://app.kovari.in";
  });

  it("dispatches immediately when recipient has no active sockets", async () => {
    mockSCard.mockResolvedValue(0);

    await bufferNotification(
      "user_recipient_clerk",
      "uuid-a_uuid-b",
      "Sender",
      "",
      "hello",
      "uuid-b",
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockSet).not.toHaveBeenCalled();
  });

  it("starts batch timer when recipient still has an active socket", async () => {
    mockSCard.mockImplementation(async (key: string) =>
      key.includes("user_socket") ? 1 : 0,
    );

    await bufferNotification(
      "user_recipient_clerk",
      "uuid-a_uuid-b",
      "Sender",
      "",
      "hello",
      "uuid-b",
    );

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockSet).toHaveBeenCalled();
  });
});
