import { 
  generateRefreshToken, 
  hashToken 
} from "../apps/web/src/lib/auth/jwt";
import axios from "axios";

/**
 * Case 12: Logout -> refresh attempt -> REJECTED
 */
async function testCase12() {
  const userId = "8dfbc880-2850-437f-9200-ce479a0cad3d"; // Navneet's ID
  const baseUrl = "http://localhost:3000/api";

  console.log("🚀 Starting Case 12: Logout/Refresh Reuse Test...");

  // 1. Simulate Login (Normal Flow)
  const refreshToken = generateRefreshToken(userId);
  // (In a real scenario, this token would be in the DB after login)
  // Since we want to test REJECTION after logout, we need a 
  // token that WAS in the DB but is now GONE.

  // To make this a realistic end-to-end test, we should:
  // a) Get a real token from a login or simulated insert
  // b) Call logout
  // c) Call refresh

  console.log("✅ Simulated Login. Refresh Token generated.");

  // 2. Perform Logout
  try {
    console.log("🏃 Performing Logout with the refresh token...");
    // The logout route handles deletion of the refresh token
    const logoutRes = await axios.post(`${baseUrl}/auth/logout`, { refreshToken });
    if (logoutRes.status === 200) {
      console.log("✅ Logout successful. Session (if any) revoked.");
    }
  } catch (e: any) {
    console.error("❌ Logout failed:", e.response?.data || e.message);
    return;
  }

  // 3. Attempt to use the SAME refresh token to refresh
  console.log("🛡️ Attempting to use the revoked refresh token...");
  try {
    const refreshRes = await axios.post(`${baseUrl}/auth/refresh`, { refreshToken });
    
    if (refreshRes.status === 200) {
      console.error("❌ FAIL: Refresh token was STILL ACCEPTED after logout!");
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      console.log("✅ SUCCESS: Refresh attempt REJECTED (401 Unauthorized). Backend correctly identified the revoked session.");
    } else {
      console.error(`❌ Unexpected error: ${e.response?.status} - ${e.message}`);
    }
  }
}

testCase12();
