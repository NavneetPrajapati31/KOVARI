import { calculateMatchScore, Traveler } from "./matching";

const user: Traveler = {
  id: "1",
  name: "User One",
  age: 25,
  destination: "Paris",
  startDate: "2025-07-10",
  endDate: "2025-07-15",
  interests: ["hiking", "food", "museums"],
  travelModes: ["train", "car"],
  profession: "Engineer",
};

const other: Traveler = {
  id: "2",
  name: "User Two",
  age: 28,
  destination: "Paris",
  startDate: "2025-07-12",
  endDate: "2025-07-18",
  interests: ["food", "museums", "photography"],
  travelModes: ["train"],
  profession: "Engineer",
};

test("should calculate correct match score", () => {
  const score = calculateMatchScore(user, other);
  console.log("Match Score:", score);
  // +30 (destination) +20 (dates) +15 (2 interests) +10 (age) +10 (travel mode) +5 (profession)
  expect(score).toBe(90);
});
