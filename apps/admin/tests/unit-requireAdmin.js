import assert from "assert";
import { createRequire } from "module";
import { config } from "dotenv";

// Load .env.local if it exists
config({ path: ".env.local" });

(async () => {
  // Stub server-only to allow importing server code in Node
  const require = createRequire(import.meta.url);
  require.cache[require.resolve("server-only")] = { exports: {} };

  // Mock Clerk and Supabase modules
  const auth = { mockResolvedValue: (v) => (auth.value = v), value: null };
  const clerkClient = { mockResolvedValue: (v) => (clerkClient.value = v), value: null };

  // Patch module exports
  require.cache[require.resolve("@clerk/nextjs/server")] = {
    exports: {
      auth: async () => auth.value,
      clerkClient: async () => clerkClient.value,
    },
  };

  // Use real Supabase (env vars must be set). Clerk is still mocked for deterministic email/user.
  const testAdminEmail =
    process.env.ADMIN_TEST_EMAIL ||
    process.env.TEST_ADMIN_EMAIL ||
    process.env.ADMIN_EMAIL ||
    null;
  if (!testAdminEmail) {
    throw new Error(
      "Set ADMIN_TEST_EMAIL (or ADMIN_EMAIL/TEST_ADMIN_EMAIL) to an admin email present in Supabase"
    );
  }

  const adminAuth = await import("../lib/adminAuth");

  auth.mockResolvedValue({ userId: "user_1" });
  clerkClient.mockResolvedValue({
    users: {
      getUser: async () => ({ emailAddresses: [{ emailAddress: testAdminEmail }] }),
    },
  });

  const res = await adminAuth.requireAdmin();
  assert.ok(res?.adminId, "adminId should be returned");
  assert.strictEqual(res?.email?.toLowerCase(), testAdminEmail.toLowerCase());
  console.log("requireAdmin accepts admin");

  let rejected = false;
  try {
    await adminAuth.requireAdmin();
  } catch {
    rejected = true;
  }
  assert.ok(rejected, "non-admin should reject");
  console.log("requireAdmin rejects non-admin");
})();