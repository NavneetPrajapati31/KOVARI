import axios from "axios";

/**
 * Case 23: Missing Authorization header -> 401 & No Crash
 */
async function testCase23() {
  const baseUrl = "http://localhost:3000/api";

  console.log("🚀 Starting Case 23: Missing Authorization Header Test...");

  try {
    console.log("🛡️ Calling protected route /api/profile with NO Authorization header...");
    const res = await axios.post(`${baseUrl}/profile`, {}, {
      // Intentionally omitting headers
    });

    if (res.status === 200) {
      console.error("❌ FAIL: Route accepted request without authentication!");
    }
  } catch (e: any) {
    if (e.response?.status === 401) {
      console.log("✅ SUCCESS: Request rejected with 401 Unauthorized.");
      console.log("✨ RESULT: Backend correctly handled the missing header without crashing.");
    } else {
      console.error(`❌ Unexpected error: ${e.response?.status || 'No Response'} - ${e.message}`);
    }
  }
}

testCase23();
