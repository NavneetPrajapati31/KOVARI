import { describe, it, expect } from "vitest";
import { notificationSocketRoomIds } from "./realtimeNotificationTypes";

describe("notificationSocketRoomIds", () => {
  it("returns both clerk and UUID when different", () => {
    expect(
      notificationSocketRoomIds("user_clerk_abc", "550e8400-e29b-41d4-a716-446655440000"),
    ).toEqual(["user_clerk_abc", "550e8400-e29b-41d4-a716-446655440000"]);
  });

  it("deduplicates when clerk and UUID are identical", () => {
    expect(
      notificationSocketRoomIds("same-id", "same-id"),
    ).toEqual(["same-id"]);
  });

  it("returns UUID only when clerk is missing (mobile-only user)", () => {
    expect(
      notificationSocketRoomIds(null, "550e8400-e29b-41d4-a716-446655440000"),
    ).toEqual(["550e8400-e29b-41d4-a716-446655440000"]);
  });

  it("returns clerk only when UUID is missing (web-only path)", () => {
    expect(notificationSocketRoomIds("user_clerk_xyz", null)).toEqual([
      "user_clerk_xyz",
    ]);
  });

  it("returns empty when both identities are missing", () => {
    expect(notificationSocketRoomIds("", undefined)).toEqual([]);
  });
});
