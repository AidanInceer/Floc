import { test } from "node:test";
import assert from "node:assert/strict";
import { switchWarning } from "./hooks.mjs";

test("moving a task worktree onto another task's branch warns", () => {
  const root = "C:\\dev\\Floc\\.claude\\worktrees\\review-app";
  assert.match(switchWarning({ root, branch: "feature/app-overview-polish" }), /One task, one worktree/);
  assert.equal(switchWarning({ root, branch: "feature/review-app" }), null);
  assert.equal(switchWarning({ root, branch: "worktree-agent-1" }), null);
  assert.equal(switchWarning({ root: "C:\\dev\\Floc", branch: "feature/a" }), null);
});
