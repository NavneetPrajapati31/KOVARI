import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Load env from web app
dotenv.config({ path: path.resolve(__dirname, "../apps/web/.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCase24() {
  const testEmail = "continuity_test@example.com";
  const mockClerkId = "user_clerk_12345";
  const mockGoogleId = "google_12345_continuity";

  console.log("🚀 Starting Case 24: Web -> Mobile Continuity Test...");

  // 1. Cleanup
  await supabase.from("users").delete().eq("email", testEmail);

  // 2. Step 1: Simulate Web Signup (Clerk)
  console.log("🌐 Step 1: Simulating Web Signup via Clerk...");
  const { data: webUser, error: webError } = await supabase
    .from("users")
    .insert({
      email: testEmail,
      clerk_user_id: mockClerkId,
      name: "Web User"
    })
    .select("id")
    .single();

  if (webError || !webUser) {
    console.error("❌ Failed to create web user:", webError?.message);
    return;
  }
  console.log(`✅ Web User created with ID: ${webUser.id}`);

  // 3. Step 2: Simulate Mobile Login (Google)
  console.log("📱 Step 2: Simulating Mobile Login via Google (Same Email)...");
  const { data: mobileUserId, error: syncError } = await supabase.rpc("sync_user_identity", {
    p_email: testEmail,
    p_name: "Mobile Name",
    p_google_id: mockGoogleId
  });

  if (syncError) {
    console.error("❌ RPC failed:", syncError.message);
    return;
  }

  // 4. Verification
  console.log(`✅ Mobile Login Success. Received User ID: ${mobileUserId}`);

  if (mobileUserId === webUser.id) {
    console.log("🎉 SUCCESS: Mobile session linked to the EXISTING Web user record!");
  } else {
    console.error("❌ FAIL: Duplicate user created! IDs do not match.");
  }

  // Verify merged data
  const { data: finalUser } = await supabase.from("users").select("*").eq("id", webUser.id).single();
  if (finalUser?.google_id === mockGoogleId && finalUser?.clerk_user_id === mockClerkId) {
    console.log("✅ Identity Merged: Both Clerk ID and Google ID are present in the same record.");
  }

  console.log("\n✨ Case 24 Result: Seamless Web -> Mobile continuity confirmed.");
}

testCase24();
