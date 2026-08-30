import { describe, expect, it } from "vitest";
import { groupTransformer } from "./groupTransformer";

describe("groupTransformer", () => {
  it("maps cover image to canonical and legacy keys", () => {
    const result = groupTransformer.toStandard({
      id: "group-1",
      name: "Tokyo Crew",
      destination: "Tokyo",
      coverImage: "https://cdn.example.com/cover.jpg",
      membersCount: 4,
      score: 0.82,
    });

    expect(result.coverImage).toBe("https://cdn.example.com/cover.jpg");
    expect(result.cover_image).toBe("https://cdn.example.com/cover.jpg");
    expect(result.image).toBe("https://cdn.example.com/cover.jpg");
    expect(result.avatar).toBe("https://cdn.example.com/cover.jpg");
  });

  it("preserves group metadata required by mobile cards", () => {
    const result = groupTransformer.toStandard({
      id: "group-2",
      name: "Bali Trip",
      destination: "Bali",
      description: "Beach lovers welcome",
      topInterests: ["Surfing", "Food"],
      dominantLanguages: ["English", "Indonesian"],
      non_smokers: true,
      non_drinkers: false,
      startDate: "2026-09-01",
      endDate: "2026-09-10",
      membersCount: 3,
      score: 0.71,
    });

    expect(result.description).toBe("Beach lovers welcome");
    expect(result.tags).toEqual(["Surfing", "Food"]);
    expect(result.interests).toEqual(["Surfing", "Food"]);
    expect(result.languages).toEqual(["English", "Indonesian"]);
    expect(result.smokingPolicy).toBe("Non-smokers preferred");
    expect(result.drinkingPolicy).toBeNull();
    expect(result.dateRange).toEqual({
      start: "2026-09-01",
      end: "2026-09-10",
      isOngoing: false,
    });
  });

  it("supports legacy image and avatar aliases", () => {
    const result = groupTransformer.toStandard({
      id: "group-3",
      name: "Legacy Group",
      destination: "Paris",
      image: "https://cdn.example.com/legacy.jpg",
      membersCount: 2,
    });

    expect(result.coverImage).toBe("https://cdn.example.com/legacy.jpg");
    expect(result.image).toBe("https://cdn.example.com/legacy.jpg");
  });

  it("handles missing optional metadata safely", () => {
    const result = groupTransformer.toStandard({
      id: "group-4",
      name: "Minimal Group",
      destination: "London",
      membersCount: 1,
    });

    expect(result.description).toBeNull();
    expect(result.tags).toEqual([]);
    expect(result.languages).toEqual([]);
    expect(result.smokingPolicy).toBeNull();
    expect(result.drinkingPolicy).toBeNull();
    expect(result.dateRange).toBeNull();
  });
});
