import { describe, expect, it, vi } from "vitest";
import { DELETED_ACCOUNT_LOGIN_MESSAGE, isDeletedLoginUser } from "@kovari/api/auth/deleted-account";
import { evaluatePasswordLogin } from "./loginCredentials";

describe("isDeletedLoginUser", () => {
  it("returns true for soft-deleted rows", () => {
    expect(isDeletedLoginUser({ isDeleted: true })).toBe(true);
  });

  it("returns true when deletedAt is set", () => {
    expect(
      isDeletedLoginUser({ isDeleted: false, deletedAt: "2026-08-30T00:00:00.000Z" }),
    ).toBe(true);
  });

  it("returns false for active rows", () => {
    expect(isDeletedLoginUser({ isDeleted: false })).toBe(false);
    expect(isDeletedLoginUser(null)).toBe(false);
  });
});

describe("evaluatePasswordLogin", () => {
  const compare = vi.fn(async () => true);

  it("accepts active account with valid password", async () => {
    const result = await evaluatePasswordLogin(
      {
        id: "user-1",
        email: "qa@example.com",
        password_hash: "hash",
        isDeleted: false,
      },
      "secret",
      compare,
    );

    expect(result).toBe("ok");
  });

  it("rejects deleted account even with matching password hash", async () => {
    const result = await evaluatePasswordLogin(
      {
        id: "user-1",
        email: "qa@example.com",
        password_hash: "hash",
        isDeleted: true,
      },
      "secret",
      compare,
    );

    expect(result).toBe("deleted");
  });

  it("rejects invalid credentials for active account", async () => {
    compare.mockResolvedValueOnce(false);

    const result = await evaluatePasswordLogin(
      {
        id: "user-1",
        email: "qa@example.com",
        password_hash: "hash",
        isDeleted: false,
      },
      "wrong",
      compare,
    );

    expect(result).toBe("invalid");
  });

  it("exports deleted-account message for login responses", () => {
    expect(DELETED_ACCOUNT_LOGIN_MESSAGE).toContain("deleted");
  });
});
