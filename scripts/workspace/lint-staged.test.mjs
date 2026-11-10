import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import config from "../../lint-staged.config.mjs";

test("a commit lints its staged files and runs no tests; tests run in CI on the PR", () => {
  const commands = config["*.{ts,tsx}"](["/r/floc/apps/web/src/a.tsx", "/r/floc/packages/floc-core/src/b.ts"]);
  assert.equal(commands.length, 1);
  assert.match(commands[0], /^node node_modules\/eslint\/bin\/eslint\.js .*"\/r\/floc\/apps\/web\/src\/a\.tsx" "\/r\/floc\/packages\/floc-core\/src\/b\.ts"$/);
  assert.ok(commands.every((c) => !c.includes("vitest")));
  assert.deepEqual(config["*.{ts,tsx}"]([resolve("floc/wireframe/pick-a/tui.ts")]), []);
});

test("a big commit lints in few batches, each far under the 32767-character CreateProcess limit", () => {
  const files = Array.from({ length: 400 }, (_, i) => `C:/dev/Floc/.claude/worktrees/a-long-task-name/floc/apps/web/src/app/trip/[id]/days/f${i}.ts`);
  const commands = config["*.{ts,tsx}"](files);
  assert.ok(commands.length > 1 && commands.length <= 3);
  assert.ok(commands.every((c) => c.length < 30000));
  assert.equal(commands.join(" ").match(/\.ts"/g).length, 400);
});
