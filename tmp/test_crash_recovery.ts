import { 
  generateAccessToken, 
  generateRefreshToken, 
  hashToken 
} from "../apps/web/src/lib/auth/jwt";
import axios from "axios";

/**
 * Case 13: App crash before logout completes -> SELF-HEALING
 * Simulates: Backend session deleted, but Client still has tokens.
 */
async function testCase13() {
  const userId = "8dfbc880-2850-437f-9200-ce479a0cad3d"; 
  const baseUrl = "http://localhost:3000/api";

  console.log("🚀 Starting Case 13: Crash Recovery Test...");

  // 1. Simulate Login (Tokens generated)
  const refreshToken = generateRefreshToken(userId);
  const tokenHash = hashToken(refreshToken);
  const accessToken = generateAccessToken(userId, tokenHash);

  console.log("✅ Simulated Login. Access Token generated.");

  // 2. Simulate CRASH Scenario:
  // Step A: Manually delete the session from DB (simulates server-logout success)
  try {
    console.log("🏃 Simulating server-side logout (deleting session record)...");
    await axios.post(`${baseUrl}/auth/logout`, { refreshToken });
    console.log("✅ Session record deleted from database.");
  } catch (e: any) {
    console.error("❌ Pre-test cleanup failed:", e.message);
    return;
  }

  // Step B: Simulating "App Crash" -> Local storage was NOT cleared!
  console.log("🧟 Current State: Client still has 'Zombie' tokens in its memory/storage.");

  // 3. Simulate "Next Launch" -> First API Call
  console.log("🛡️ App re-launches. Attempting to fetch current profile with zombie token...");
  try {
    const profileRes = await axios.get(`${baseUrl}/profile/current`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (profileRes.status === 200) {
      console.error("❌ FAIL: Zombie token was ACCEPTED!");
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      console.log("✅ SUCCESS: Zombie token REJECTED (401 Unauthorized).");
      console.log("✨ RESULT: Mobile app will now trigger its Reactive Logout (Case 10), clearing the zombie tokens and healing itself.");
    } else {
      console.error(`❌ Unexpected error: ${e.response?.status} - ${e.message}`);
    }
  }
}

testCase13();
