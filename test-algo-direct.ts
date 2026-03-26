import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { findGroupMatchesForUser } from "./src/lib/matching/group";

async function run() {
  const user = {
    userId: "test-user-1",
    destination: { lat: 26.9124, lon: 75.7873 }, // Jaipur
    budget: 20000,
    startDate: "2026-03-25",
    endDate: "2026-03-29",
    age: 25,
    languages: ["English", "Hindi"],
    interests: ["Sightseeing", "Food"],
    smoking: true,
    drinking: false,
    nationality: "Indian"
  };

  const groups = [
    {
      groupId: "test-group-1",
      name: "Jaipur group 2",
      destination: { lat: 26.9124, lon: 75.7873 },
      averageBudget: 10000,
      startDate: "2026-03-25",
      endDate: "2026-03-29",
      averageAge: 21,
      dominantLanguages: ["English"],
      topInterests: ["Sightseeing"],
      smokingPolicy: "Non-Smoking",
      drinkingPolicy: "Non-Drinking",
      dominantNationalities: ["Indian"],
      distanceKm: 0,
      originalData: {}
    }
  ];

  console.log("Calling findGroupMatchesForUser with ML enabled...");
  const filterBoost: any = {
    lifestyle: { boost: 2.0 },
    interests: { values: ["Sightseeing"], boost: 2.0 }
  };
  const matches = await findGroupMatchesForUser(user as any, groups as any, 200, filterBoost, true);
  console.log("Matches returned:", JSON.stringify(matches, null, 2));
}

run().catch(console.error);
