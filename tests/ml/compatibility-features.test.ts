import test, { describe } from "node:test";
import assert from "node:assert/strict";
import { extractCompatibilityFeatures } from "../../src/lib/ai/features/compatibility-features.ts";
import { NEUTRAL_SCORE } from "../../src/lib/ai/utils/ml-types.ts";

describe("compatibility feature extractor", () => {
  const soloUser = {
    destination: { lat: 10, lon: 10 },
    startDate: "2025-01-01",
    endDate: "2025-01-10",
    budget: 1000,
    static_attributes: {
      age: 25,
      interests: ["hiking", "food"],
      personality: "introvert",
      location: { lat: 10.1, lon: 10.1 },
    },
  };

  const soloMatch = {
    destination: { lat: 10.05, lon: 10.05 },
    startDate: "2025-01-05",
    endDate: "2025-01-12",
    budget: 1100,
    static_attributes: {
      age: 27,
      interests: ["food", "music"],
      personality: "ambivert",
      location: { lat: 10.2, lon: 10.2 },
    },
  };

  const groupTarget = {
    destination: { lat: 10.05, lon: 10.05 },
    startDate: "2025-01-05",
    endDate: "2025-01-12",
    averageBudget: 1100,
    averageAge: 27,
    topInterests: ["food", "music"],
    dominantLanguages: ["en", "fr"],
    dominantNationalities: ["in", "fr"],
    smokingPolicy: "Mixed",
    drinkingPolicy: "Mixed",
    size: 8,
  };

  const baseKeys = [
    "matchType",
    "distanceScore",
    "dateOverlapScore",
    "budgetScore",
    "interestScore",
    "ageScore",
    "personalityScore",
  ];

  test("schema: solo emits base schema, no group-only fields", () => {
    const features = extractCompatibilityFeatures("user_user", soloUser, soloMatch);
    baseKeys.forEach((k) => assert.ok(k in features));
    assert.strictEqual(features.groupSizeScore, undefined);
    assert.strictEqual(features.groupDiversityScore, undefined);
  });

  test("schema: group emits base schema plus group-only fields", () => {
    const features = extractCompatibilityFeatures("user_group", soloUser, groupTarget);
    baseKeys.forEach((k) => assert.ok(k in features));
    assert.notStrictEqual(features.groupSizeScore, undefined);
    assert.notStrictEqual(features.groupDiversityScore, undefined);
  });

  test("range: all numeric features are in [0,1]", () => {
    const features = extractCompatibilityFeatures("user_group", soloUser, groupTarget);
    Object.values(features).forEach((v) => {
      if (typeof v === "number") {
        assert.ok(v >= 0 && v <= 1);
      }
    });
  });

  test("neutral defaults: missing personality yields neutral for group", () => {
    const features = extractCompatibilityFeatures(
      "user_group",
      { ...soloUser, static_attributes: { ...soloUser.static_attributes, personality: undefined } },
      groupTarget
    );
    assert.strictEqual(features.personalityScore, NEUTRAL_SCORE);
  });

  test("determinism: same inputs produce same outputs", () => {
    const f1 = extractCompatibilityFeatures("user_user", soloUser, soloMatch);
    const f2 = extractCompatibilityFeatures("user_user", soloUser, soloMatch);
    assert.deepStrictEqual(f1, f2);
  });
});

