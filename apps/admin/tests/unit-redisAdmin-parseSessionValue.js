import assert from "assert";
import { createRequire } from "module";

// Wrap in async IIFE to allow dynamic import without top-level await in CJS mode
(async () => {
  const require = createRequire(import.meta.url);
  require.cache[require.resolve("server-only")] = { exports: {} };

  const { parseSessionValue } = await import("../lib/redisAdmin.js");

  assert.deepStrictEqual(parseSessionValue('{"a":1}'), { a: 1 });
  assert.strictEqual(parseSessionValue(null), null);
  assert.strictEqual(parseSessionValue("not-json"), null);
  console.log("parseSessionValue unit tests passed");
})();