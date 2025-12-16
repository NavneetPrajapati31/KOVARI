import assert from "assert";
import { createRequire } from "module";
import fetch from "node-fetch";

(async () => {
  // Stub server-only before loading redisAdmin (works with tsx CJS transform)
  const require = createRequire(import.meta.url);
  require.cache[require.resolve("server-only")] = { exports: {} };

  const { default: redis } = await import("../lib/redisAdmin.js");

  async function setupKey() {
  await redis.connect?.();
  await redis.set("session:test:1", JSON.stringify({ userId: "u1", destination: "DXB", budget: 1000 }));
}

async function testList() {
  const res = await fetch("http://localhost:3000/api/admin/sessions?limit=5");
  assert.ok(res.ok);
  const json = await res.json();
  const found = json.sessions.some((s) => s.sessionKey === "session:test:1");
  assert.ok(found, "session:test:1 should be listed");
}

async function testExpireRejectConfirm() {
  const res = await fetch("http://localhost:3000/api/admin/sessions/expire", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionKey: "session:test:1" }), // no confirm
  });
  assert.strictEqual(res.status, 400);
}

async function testExpireAndLog() {
  const res = await fetch("http://localhost:3000/api/admin/sessions/expire", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionKey: "session:test:1", confirm: true, reason: "test" }),
  });
  assert.ok(res.ok);
  const exists = await redis.exists("session:test:1");
  assert.strictEqual(exists, 0, "key should be removed");
  // Optionally query Supabase test DB for admin_actions insertion
}

  await setupKey();
  await testList();
  await testExpireRejectConfirm();
  await testExpireAndLog();
  console.log("Integration tests passed");
  process.exit(0);
})();