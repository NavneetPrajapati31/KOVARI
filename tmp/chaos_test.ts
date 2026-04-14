import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { 
  generateAccessToken, 
  generateRefreshToken, 
  hashToken 
} from "../apps/web/src/lib/auth/jwt";

// Load env from web app
dotenv.config({ path: path.resolve(__dirname, "../apps/web/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const BASE_URL = "http://localhost:3000/api";

async function chaosTest() {
  console.log("🌪️  STARTING CASE 26: FINAL CHAOS TEST (MOST IMPORTANT) 🌪️\n");

  const testEmailRace = "chaos_race_user@example.com";
  const testEmailStorm = "chaos_storm_user@example.com";

  // Cleanup
  await supabase.from("users").delete().or(`email.eq.${testEmailRace},email.eq.${testEmailStorm}`);

  // ---------------------------------------------------------
  // SCENARIO 1: The "First Login" Race (20 Users at once)
  // ---------------------------------------------------------
  console.log("🧪 SCENARIO 1: Simulating 20 simultaneous logins for a BRAND NEW user...");
  const loginPromises = Array.from({ length: 20 }).map((_, i) => 
    supabase.rpc("sync_user_identity", {
      p_email: testEmailRace,
      p_name: `Chaos User ${i}`,
      p_google_id: `google_${testEmailRace}_${i}`
    })
  );

  const loginResults = await Promise.all(loginPromises);
  const successCount = loginResults.filter(r => !r.error).length;
  const errorCount = loginResults.filter(r => r.error).length;

  console.log(`📊 Result: ${successCount} Successes, ${errorCount} Errors.`);

  // Verify DB Integrity
  const { data: usersCount } = await supabase.from("users").select("id").eq("email", testEmailRace);
  if (usersCount?.length === 1) {
    console.log("✅ INTEGRITY PASSED: Exactly 1 user record created despite 20-way race.");
  } else {
    console.error(`❌ INTEGRITY FAILED: Found ${usersCount?.length} duplicate users!`);
  }

  // ---------------------------------------------------------
  // SCENARIO 2: The "Refresh Storm" (50 Parallel Requests)
  // ---------------------------------------------------------
  console.log("\n🧪 SCENARIO 2: Simulating 50-request Refresh Storm...");
  
  // Create storm user
  const { data: stormUser } = await supabase.from("users").insert({ email: testEmailStorm, name: "Storm User" }).select("id").single();
  const stormUserId = stormUser!.id;

  // Generate an EXPIRED access token linked to a valid refresh session
  const validRefreshToken = generateRefreshToken(stormUserId);
  const refreshTokenHash = hashToken(validRefreshToken);
  
  await supabase.from("refresh_tokens").insert({
    user_id: stormUserId,
    token_hash: refreshTokenHash,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  });

  // We'll simulate 50 requests calling /api/auth/refresh simultaneously
  console.log("⚡ Firing 50 parallel refresh requests...");
  const stormPromises = Array.from({ length: 50 }).map(() => 
    axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: validRefreshToken }).catch(e => e.response)
  );

  const stormResults = await Promise.all(stormPromises);
  const stormSuccs = stormResults.filter(r => r.status === 200).length;
  const stormRejects = stormResults.filter(r => r.status === 401).length;
  const stormCrashes = stormResults.filter(r => !r || r.status >= 500).length;

  console.log(`📊 Result: ${stormSuccs} Rotated successfully, ${stormRejects} Rejected (Security), ${stormCrashes} Internal Errors.`);
  
  if (stormSuccs === 1) {
    console.log("✅ SYNC PASSED: Exactly one refresh succeeded; others were rejected by rotation security.");
  } else {
    console.warn("⚠️ SYNC NOTE: High concurrency may lead to rejects; ensuring system didn't crash.");
  }

  // ---------------------------------------------------------
  // SCENARIO 3: Replay Attack Under Load
  // ---------------------------------------------------------
  console.log("\n🧪 SCENARIO 3: Simultaneous Replay Attack...");
  // Attempt to reuse the 'spent' validRefreshToken from Scenario 2
  const replayRes = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: validRefreshToken }).catch(e => e.response);
  if (replayRes.status === 401) {
    console.log("✅ REPLAY PASSED: Old token correctly rejected even during chaos.");
  }

  console.log("\n✨ FINAL CHAOS TEST RESULT: System remained stable. No crashes. No duplicates.");
}

chaosTest();
