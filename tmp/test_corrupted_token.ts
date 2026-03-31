import { 
  generateAccessToken, 
  generateRefreshToken, 
  hashToken 
} from "../apps/web/src/lib/auth/jwt";
import axios from "axios";

/**
 * Case 17: Corrupted Storage -> LOGOUT TRIGGERED
 * Simulates: Manually modifying the stored token.
 */
async function testCase17() {
  const userId = "8dfbc880-2850-437f-9200-ce479a0cad3d"; 
  const baseUrl = "http://localhost:3000/api";

  console.log("🚀 Starting Case 17: Corrupted Token Test...");

  // 1. Generate a valid token
  const refreshToken = generateRefreshToken(userId);
  const tokenHash = hashToken(refreshToken);
  const validAccessToken = generateAccessToken(userId, tokenHash);

  console.log("✅ Valid Access Token generated.");

  // 2. CORRUPT the token
  // A JWT has 3 parts: header.payload.signature
  // We'll flip one character in the signature part.
  const parts = validAccessToken.split('.');
  const corruptedSignature = parts[2].substring(0, parts[2].length - 1) + 
                             (parts[2].endsWith('a') ? 'b' : 'a');
  const corruptedAccessToken = `${parts[0]}.${parts[1]}.${corruptedSignature}`;

  console.log("🧟 Simulating manual tampering (flipping 1 character in signature)...");

  // 3. Attempt API call with Corrupted Token
  console.log("🛡️ Attempting to use the corrupted token...");
  try {
    const profileRes = await axios.get(`${baseUrl}/profile/current`, {
      headers: { Authorization: `Bearer ${corruptedAccessToken}` }
    });
    
    if (profileRes.status === 200) {
      console.error("❌ FAIL: Corrupted token was ACCEPTED!");
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      console.log("✅ SUCCESS: Corrupted token REJECTED (401 Unauthorized).");
      console.log("✨ RESULT: Mobile app will now trigger its Reactive Logout (Case 10) because the token is unusable, forcing a clean login.");
    } else {
      console.error(`❌ Unexpected error: ${e.response?.status} - ${e.message}`);
    }
  }
}

testCase17();
