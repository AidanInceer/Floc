import { test } from "node:test";
import assert from "node:assert/strict";
import { guardVerdict } from "./guard.mjs";

const flocCommon = "C:\\dev\\Floc\\.git";

test("a tracked file in the main checkout is blocked", () => {
  assert.equal(guardVerdict({ flocCommon, fileCommon: flocCommon, fileGitDir: flocCommon, ignored: false }).allow, false);
});

test("a worktree, an ignored file or another repository is allowed", () => {
  assert.equal(guardVerdict({ flocCommon, fileCommon: flocCommon, fileGitDir: `${flocCommon}\\worktrees\\a`, ignored: false }).allow, true);
  assert.equal(guardVerdict({ flocCommon, fileCommon: flocCommon, fileGitDir: flocCommon, ignored: true }).allow, true);
  assert.equal(guardVerdict({ flocCommon, fileCommon: "C:\\dev\\Floc\\docs\\.git", fileGitDir: "C:\\dev\\Floc\\docs\\.git", ignored: false }).allow, true);
  assert.equal(guardVerdict({ flocCommon, fileCommon: null, fileGitDir: null, ignored: false }).allow, true);
});
