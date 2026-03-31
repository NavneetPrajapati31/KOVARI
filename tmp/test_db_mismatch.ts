import { 
  generateRefreshToken, 
  hashToken 
} from "../apps/web/src/lib/auth/jwt";
import axios from "axios";

/**
 * Case 20: Refresh token DB mismatch -> REJECTED
 * Simulates: Valid JWT signature but token not present in DB.
 */
async function testCase20() {
  const userId = "8dfbc880-2850-437f-9200-ce479a0cad3d"; 
  const baseUrl = "http://localhost:3000/api";

  console.log("🚀 Starting Case 20: DB Mismatch Test...");

  // 1. Generate a valid refresh token JWT
  // But we DO NOT insert it into the 'refresh_tokens' table.
  const validJwtButNotInDb = generateRefreshToken(userId);

  console.log("✅ Valid JWT generated (but skipped database insertion).");

  // 2. Attempt Refresh
  console.log("🛡️ Attempting to refresh using the DB-missing token...");
  try {
    const refreshRes = await axios.post(`${baseUrl}/auth/refresh`, {
      refreshToken: validJwtButNotInDb
    });
    
    if (refreshRes.status === 200) {
      console.error("❌ FAIL: Token was accepted but should have been rejected!");
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      console.log("✅ SUCCESS: Refresh REJECTED (401 Unauthorized).");
      console.log("✨ RESULT: Backend correctly verified that the token session record was missing.");
    } else {
      console.error(`❌ Unexpected error: ${e.response?.status} - ${e.message}`);
    }
  }
}

testCase20();
