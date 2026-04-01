import { z } from "zod";
import { ProfileResponseSchema } from "../packages/api/src/contracts/profile";

async function runTests() {
  console.log("🧪 Running Profile API Contract Validation...");

  // Test 1: Complete fully populated Profile
  const completeProfile = {
    id: "uuid-1234-abcd-5678",
    avatar: "https://example.com/avatar.png",
    name: "John Doe",
    username: "john_doe",
    age: 25,
    gender: "Male",
    nationality: "US",
    profession: "Engineer",
    interests: ["coding", "travel"],
    languages: ["en"],
    bio: "Hello world!",
    birthday: "1990-01-01T00:00:00Z",
    location: "New York",
    location_details: { city: "New York" },
    religion: "Atheist",
    smoking: "No",
    drinking: "Occasionally",
    personality: "Introvert",
    foodPreference: "None",
    verified: true,
    destinations: ["Japan"],
    tripFocus: ["culture"],
    travelFrequency: "yearly",
    onboardingCompleted: true,
  };

  try {
    ProfileResponseSchema.parse(completeProfile);
    console.log("✅ Test 1 Passed: Valid full profile parsed correctly against strict Zod Schema.");
  } catch (e) {
    console.error("❌ Test 1 Failed: Schema validation error", e);
    process.exit(1);
  }

  // Test 2: Incomplete profile (This mimics the exact payload the Next Route handler creates to prevent 404s!)
  const routeGeneratedProfile = {
    id: "uuid-5678-abcd-1234",
    avatar: "",
    name: "",
    username: "",
    age: 0,
    gender: "Prefer not to say",
    nationality: "",
    profession: "",
    interests: [],
    languages: [],
    bio: "",
    birthday: "",
    location: "",
    location_details: {},
    religion: "",
    smoking: "",
    drinking: "",
    personality: "",
    foodPreference: "",
    verified: false,
    destinations: [],
    tripFocus: [],
    travelFrequency: "",
    onboardingCompleted: false, // Critical check: New users are mapped to onboardingCompleted = false
  };

  try {
    ProfileResponseSchema.parse(routeGeneratedProfile);
    console.log(" Test 2 Passed: Empty/default route-generated profile parsed correctly!");
  } catch (e) {
    console.error(" Test 2 Failed - Contract rejected route defaults", (e as z.ZodError).issues);
    process.exit(1);
  }

  console.log("🎉 All Contract Tests Passed Successfully!");
}

runTests();
