import { test } from "node:test";
import assert from "node:assert/strict";
import config from "../../lint-staged.config.mjs";

test("a commit lints its staged files and runs no tests; tests run in CI on the PR", () => {
  const commands = config["*.{ts,tsx}"](["/r/floc/apps/web/src/a.tsx", "/r/floc/packages/floc-core/src/b.ts"]);
  assert.equal(commands.length, 1);
  assert.match(commands[0], /^eslint .*"\/r\/floc\/apps\/web\/src\/a\.tsx" "\/r\/floc\/packages\/floc-core\/src\/b\.ts"$/);
  assert.ok(commands.every((c) => !c.includes("vitest")));
});

test("a big commit lints in batches, so cmd.exe never gets a line too long", () => {
  const files = Array.from({ length: 61 }, (_, i) => `/r/floc/apps/web/src/f${i}.ts`);
  assert.equal(config["*.{ts,tsx}"](files).length, 3);
});
