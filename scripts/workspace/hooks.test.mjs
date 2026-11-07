import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { switchWarning } from "./hooks.mjs";

test("moving a task worktree onto another task's branch warns", () => {
  const root = resolve("/dev/Floc/.claude/worktrees/review-app");
  assert.match(switchWarning({ root, branch: "feature/app-overview-polish" }), /One task, one worktree/);
  assert.equal(switchWarning({ root, branch: "feature/review-app" }), null);
  assert.equal(switchWarning({ root, branch: "worktree-agent-1" }), null);
  assert.equal(switchWarning({ root: resolve("/dev/Floc"), branch: "feature/a" }), null);
});
