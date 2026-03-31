import { 
  generateAccessToken, 
  generateRefreshToken, 
  hashToken 
} from "../apps/web/src/lib/auth/jwt";
import axios from "axios";

/**
 * Case 11: Logout then reuse token -> REJECTED
 */
async function testCase11() {
  const userId = "8dfbc880-2850-437f-9200-ce479a0cad3d"; // Navneet's ID
  const baseUrl = "http://localhost:3000/api";

  console.log("🚀 Starting Case 11: Logout/Reuse Test...");

  // 1. Simulate Login (Normal Flow)
  const refreshToken = generateRefreshToken(userId);
  const tokenHash = hashToken(refreshToken);
  const accessToken = generateAccessToken(userId, tokenHash);

  console.log("✅ Simulated Login. Access Token generated with session hash.");

  // 2. Perform Logout (Deletes the refresh token from DB)
  try {
    console.log("🏃 Performing Logout...");
    const logoutRes = await axios.post(`${baseUrl}/auth/logout`, { refreshToken });
    if (logoutRes.status === 200) {
      console.log("✅ Logout successful. Session record deleted (token_hash invalidated).");
    }
  } catch (e: any) {
    console.error("❌ Logout failed:", e.response?.data || e.message);
    return;
  }

  // 3. Attempt to use the OLD access token
  console.log("🛡️ Attempting to use the old access token (still cryptographically valid, but session-dead)...");
  try {
    const profileRes = await axios.get(`${baseUrl}/profile/current`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (profileRes.status === 200) {
      console.error("❌ FAIL: Access token was STILL ACCEPTED after logout!");
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      console.log("✅ SUCCESS: Access token REJECTED (401 Unauthorized). Middleware correctly identified the dead session.");
    } else {
      console.error(`❌ Unexpected error: ${e.response?.status} - ${e.message}`);
    }
  }
}

testCase11();
