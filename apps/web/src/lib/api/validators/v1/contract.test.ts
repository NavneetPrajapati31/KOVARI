import { describe, it, expect, vi } from "vitest";
import { 
  safeBatchValidate 
} from "./matchValidator";
import { 
  GoSoloMatchSchema 
} from "./matchSchemas";

// Mock logger to prevent spam during tests
vi.mock("@/lib/api/logger", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe("Matching Contract Validation (Hardened)", () => {
  const requestId = "test-request-id";

  const validMatch = {
    userId: "user-1",
    score: 0.85,
    user: {
      userId: "user-1",
      name: "John Doe",
      age: 25,
    }
  };

  const invalidMatch = {
    // userId missing
    score: "invalid",
    user: {}
  };

  describe("safeBatchValidate (Solo Matches)", () => {
    it("should pass 100% valid data as 'clean'", () => {
      const items = [
        validMatch, 
        { ...validMatch, userId: "user-2" },
        { ...validMatch, userId: "user-3" }
      ];
      const result = safeBatchValidate(items, GoSoloMatchSchema, requestId);

      expect(result.state).toBe("clean");
      expect(result.validItems.length).toBe(3);
      expect(result.droppedCount).toBe(0);
    });

    it("should filter malformed items and return 'filtered' if above threshold", () => {
      // 4 valid, 1 invalid (validCount = 4, total = 5, ratio = 0.8 > 0.3)
      const items = [
        validMatch, 
        validMatch, 
        validMatch, 
        validMatch, 
        invalidMatch
      ];
      const result = safeBatchValidate(items, GoSoloMatchSchema, requestId);

      expect(result.state).toBe("filtered");
      expect(result.validItems.length).toBe(4);
      expect(result.droppedCount).toBe(1);
    });

    it("should trigger 'degraded' if valid count is below absolute threshold (3)", () => {
      // 2 valid, 1 invalid (validCount = 2, total = 3, ratio = 0.66 > 0.3, but validCount < 3)
      const items = [validMatch, validMatch, invalidMatch];
      const result = safeBatchValidate(items, GoSoloMatchSchema, requestId);

      expect(result.state).toBe("degraded");
      expect(result.validItems.length).toBe(2);
      expect(result.droppedCount).toBe(1);
    });

    it("should trigger 'degraded' if validity ratio is below 30%", () => {
      // 2 valid, 10 total (2/10 = 20% < 30%)
      const items = [
        validMatch, 
        validMatch, 
        invalidMatch, invalidMatch, invalidMatch, 
        invalidMatch, invalidMatch, invalidMatch, 
        invalidMatch, invalidMatch
      ];
      const result = safeBatchValidate(items, GoSoloMatchSchema, requestId);

      expect(result.state).toBe("degraded"); 
      expect(result.validItems.length).toBe(2);
    });

    it("should inject safe defaults for missing optional fields", () => {
      const partialMatch = {
        userId: "user-3",
        // score and user missing
      };
      // Give 3 items to avoid 'degraded' state
      const items = [partialMatch, validMatch, validMatch];
      const result = safeBatchValidate(items, GoSoloMatchSchema, requestId);

      expect(result.state).toBe("clean"); // missing fields have defaults in schema
      const match = result.validItems[0];
      if (!match || !match.user) {
        throw new Error("Expected valid match with user data");
      }

      expect(match.score).toBe(0);
      expect(match.user.name).toBe("Traveler");
    });
  });
});
