import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cleanLocalBranch, worktreeVerdict } from "./finish.mjs";
import { git } from "./process.mjs";

test("a landed, clean worktree is removed; unsaved edits or unlanded commits keep it", () => {
  assert.deepEqual(worktreeVerdict({ dirty: false, contained: true }), { remove: true });
  assert.match(worktreeVerdict({ dirty: true, contained: true }).reason, /unsaved edits/);
  assert.match(worktreeVerdict({ dirty: false, contained: false }).reason, /did not land/);
});

const author = ["-c", "user.name=Test", "-c", "user.email=test@example.com"];
const release = { baseRefName: "main", headRefName: "release/1.2.3", isCrossRepository: false };

function checkout(t) {
  const root = mkdtempSync(join(tmpdir(), "floc-finish-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, "init", "--quiet", "-b", "develop");
  git(root, ...author, "commit", "--quiet", "--allow-empty", "-m", "Start");
  const landed = git(root, ...author, "commit-tree", "HEAD^{tree}", "-p", "HEAD", "-m", "Release");
  git(root, "update-ref", "refs/remotes/origin/main", landed);
  git(root, "branch", release.headRefName, landed);
  return root;
}

test("finish removes a merged local release branch even without a worktree", (t) => {
  const root = checkout(t);
  cleanLocalBranch(root, release);
  assert.equal(git(root, "branch", "--list", release.headRefName), "");
});

test("finish keeps a local branch with commits beyond the merged release", (t) => {
  const root = checkout(t);
  const tip = git(root, ...author, "commit-tree", "HEAD^{tree}", "-p", release.headRefName, "-m", "Unlanded work");
  const ref = `refs/heads/${release.headRefName}`;
  git(root, "update-ref", ref, tip);
  cleanLocalBranch(root, release);
  assert.equal(git(root, "rev-parse", ref), tip);
});

test("finish leaves a same-named local branch alone for a fork PR", (t) => {
  const root = checkout(t);
  cleanLocalBranch(root, { ...release, isCrossRepository: true });
  assert.notEqual(git(root, "branch", "--list", release.headRefName), "");
});

test("finish keeps develop when it is the source branch", (t) => {
  const root = checkout(t);
  git(root, "switch", "--detach", "--quiet");
  cleanLocalBranch(root, { ...release, headRefName: "develop" });
  assert.notEqual(git(root, "branch", "--list", "develop"), "");
});
