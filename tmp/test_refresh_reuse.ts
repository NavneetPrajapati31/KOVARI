import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), "apps/web/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "7e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e";

const supabase = createClient(supabaseUrl, serviceRoleKey);
const userId = "8dfbc880-2850-437f-9200-ce479a0cad3d"; // Test User

const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

async function testRefreshReuse() {
  console.log("\n--- Testing Case 8: Refresh Token Reuse Attack ---");

  // 1. Setup Session
  const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: "7d" });
  const tokenHash = hashToken(refreshToken);
  
  await supabase.from("refresh_tokens").delete().eq("user_id", userId);
  await supabase.from("refresh_tokens").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  console.log("[TEST] Initialized valid session.");

  // STEP 1: First Use (Success)
  console.log("\n[STEP 1] Using refresh token for the first time...");
  const res1 = await fetch("http://localhost:3000/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });
  
  console.log("Status Code:", res1.status);
  if (res1.status === 200) {
    console.log("✅ SUCCESS: First rotation successful.");
  } else {
    console.error("❌ FAILURE: First rotation failed", await res1.json());
    return;
  }

  // STEP 2: Reuse (Failure)
  console.log("\n[STEP 2] Attempting to REUSE the same refresh token...");
  const res2 = await fetch("http://localhost:3000/api/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  });

  console.log("Status Code:", res2.status);
  const data2 = await res2.json();
  console.log("Response Body:", data2);

  if (res2.status === 401 && data2.error.includes("refresh token session")) {
    console.log("✅ SUCCESS: Reuse attack correctly rejected with 401.");
  } else {
    console.error("❌ FAILURE: Server allowed token reuse or returned wrong error.");
  }

  // STEP 3: Stress Test (Concurrent Reuse)
  console.log("\n[STEP 3] Stress Testing: Rapid concurrent reuse attempts...");
  // Setup another session
  const stressToken = jwt.sign({ userId: userId }, REFRESH_SECRET, { expiresIn: "7d" });
  await supabase.from("refresh_tokens").insert({
    user_id: userId,
    token_hash: hashToken(stressToken),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  const attempts = 5;
  console.log(`Sending ${attempts} concurrent refresh requests...`);
  
  const results = await Promise.all(
    Array(attempts).fill(null).map(() => 
      fetch("http://localhost:3000/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: stressToken })
      })
    )
  );

  const statuses = results.map(r => r.status);
  console.log("Concurrent Status Codes:", statuses);

  const successes = statuses.filter(s => s === 200).length;
  const rejections = statuses.filter(s => s === 401).length;

  console.log(`Success count: ${successes}`);
  console.log(`Rejection count: ${rejections}`);

  if (successes === 1) {
    console.log("✅ STRESS TEST PASSED: Exactly one request succeeded, rest were rejected.");
  } else {
    console.error("❌ STRESS TEST FAILED: Potentially more than one request succeeded.");
  }

  // CLEANUP
  await supabase.from("refresh_tokens").delete().eq("user_id", userId);
  console.log("\nDone.");
}

testRefreshReuse().catch(console.error);
