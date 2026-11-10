import { test } from "node:test";
import assert from "node:assert/strict";
import { planPreCommit } from "./precommit.mjs";

const labels = (staged) => planPreCommit(staged).map(([label]) => label);

test("a docs-only commit runs the repo rules and the staged-file checks, no source analysis", () => {
  assert.deepEqual(labels(["floc/FILES.md"]), ["repo rules", "staged files"]);
  assert.deepEqual(labels(["floc/wireframe/pick-a/tui.ts"]), ["repo rules", "staged files"]);
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

test("the docs step runs only when the commit changes what it reads", () => {
  assert.ok(!labels(["floc/apps/web/src/a.ts"]).includes("docs"));
  assert.ok(labels(["floc/apps/web/src/db/schema.ts"]).includes("docs"));
  assert.ok(labels(["scripts/parity/parity.json"]).includes("docs"));
  assert.ok(labels(["AGENTS.md"]).includes("docs"));
});

test("the repo rules leave the docs step to the plan", () => {
  const [, command] = planPreCommit(["a.ts"]).find(([label]) => label === "repo rules");
  assert.deepEqual(command.slice(-2), ["--without", "docs"]);
});
