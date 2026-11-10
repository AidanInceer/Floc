import { test } from "node:test";
import assert from "node:assert/strict";
import { guardVerdict, scratchVerdict } from "./guard.mjs";

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

test("scratch files and throwaway preview routes are blocked anywhere in the repo", () => {
  for (const rel of [".tmp-edit/a.ts", "floc/.tmp-ticket.md", "floc/apps/web/src/tmpspan/span.test.ts", "floc/apps/web/src/app/dev-pro-preview/page.tsx"]) {
    assert.equal(scratchVerdict(rel).allow, false, rel);
  }
});

test("ordinary files are not mistaken for scratch", () => {
  for (const rel of ["floc/apps/web/src/app/trip/page.tsx", "scripts/templates/a.mjs", "floc/apps/web/src/components/time-picker.tsx"]) {
    assert.equal(scratchVerdict(rel).allow, true, rel);
  }
});
