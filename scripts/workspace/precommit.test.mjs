import { test } from "node:test";
import assert from "node:assert/strict";
import { planPreCommit } from "./precommit.mjs";

const labels = (staged) => planPreCommit(staged).map(([label]) => label);

test("a docs-only commit runs the repo rules and the staged-file checks, no source analysis", () => {
  assert.deepEqual(labels(["floc/FILES.md"]), ["repo rules", "staged files"]);
});

test("a source change adds the quality lint CI runs", () => {
  assert.deepEqual(labels(["scripts/a.mjs"]), ["repo rules", "staged files", "quality lint"]);
});

test("a web change adds dead-code analysis; a phone change does not", () => {
  assert.ok(labels(["floc/apps/web/src/a.ts"]).includes("dead code"));
  assert.ok(labels(["floc/apps/web/package.json"]).includes("dead code"));
  assert.ok(!labels(["floc/apps/mobile/src/a.ts"]).includes("dead code"));
});

test("every check runs through node directly, never a pnpm or cmd.exe shim", () => {
  for (const [, [runner, entry]] of planPreCommit(["floc/apps/web/src/a.ts"])) {
    assert.equal(runner, "node");
    assert.ok(entry.startsWith("scripts/") || entry.startsWith("node_modules/"));
  }
});
