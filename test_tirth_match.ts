import { findGroupMatchesForUser } from "./src/lib/matching/group";

async function run() {
  const user = {
    userId: "tirth-test",
    destination: { lat: 26.9124, lon: 75.7873 }, // Jaipur
    budget: 20000,
    startDate: "2026-03-25",
    endDate: "2026-03-29",
    age: 18,
    languages: ["English"],
    interests: [],
    smoking: true,
    drinking: false,
    nationality: "Any"
  };

  const groups = [
    {
      groupId: "7c2586c9-6d41-4a70-b296-e1ffaf21df90",
      name: "Jaipur group 2",
      destination: { lat: 26.9124, lon: 75.7873 },
      averageBudget: 10000,
      startDate: "2026-03-25",
      endDate: "2026-03-29",
      averageAge: 21,
      dominantLanguages: null,
      topInterests: null,
      smokingPolicy: "Mixed",
      drinkingPolicy: "Mixed",
      dominantNationalities: [],
      distanceKm: 0,
      originalData: {}
    }
  ];

  const filterBoost: any = {
    age: { min: 18, max: 30, boost: 2.0 },
    lifestyle: { value: true, boost: 2.0 }
  };

  console.log("Calling findGroupMatchesForUser...");
  const matches = await findGroupMatchesForUser(user as any, groups as any, 200, filterBoost, true);
  console.log("Matches returned:", JSON.stringify(matches, null, 2));
}

run().catch(console.error);
