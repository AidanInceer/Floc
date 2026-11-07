import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { baseFor, branchFor, branchVerdict, folderFor, isScratch, parseWorktrees, removeWorktree, sweepVerdict, targetFor } from "./worktrees.mjs";

test("a plain name becomes a feature branch from develop; hotfixes start from main and go back to it", () => {
  assert.equal(branchFor("Trip notes!"), "feature/trip-notes");
  assert.equal(branchFor("hotfix/login-loop"), "hotfix/login-loop");
  assert.equal(baseFor("feature/a"), "develop");
  assert.equal(targetFor("feature/a"), "develop");
  assert.equal(baseFor("hotfix/a"), "main");
  assert.equal(targetFor("hotfix/a"), "main");
  assert.equal(targetFor("release/0.213.0"), "main");
  assert.equal(folderFor("feature/trip-notes"), "trip-notes");
  assert.equal(folderFor("hotfix/login-loop"), "hotfix-login-loop");
  assert.throws(() => branchFor("!!!"), /Name the work/);
});

test("git's worktree list is read into path, branch and lock", () => {
  const list = parseWorktrees("worktree C:/dev/Floc\nHEAD abc\nbranch refs/heads/develop\n\nworktree C:/dev/Floc/.claude/worktrees/a\nHEAD def\nbranch refs/heads/feature/a\nlocked\n");
  assert.equal(list.length, 2);
  assert.equal(list[1].branch, "feature/a");
  assert.equal(list[1].locked, true);
  assert.equal(list[0].locked, false);
});

const landed = { managed: true, pr: 7, contained: true };

test("only a managed, clean worktree whose PR merged is removed", () => {
  assert.equal(sweepVerdict(landed).remove, true);
  for (const [change, reason] of [
    [{ isMain: true }, "main checkout"],
    [{ managed: false }, "not under .claude/worktrees"],
    [{ isCurrent: true }, "this session is in it"],
    [{ locked: true }, "locked"],
    [{ pr: undefined }, "no merged pull request"],
    [{ dirty: true }, "uncommitted changes"],
    [{ contained: false }, "commits not on the target branch"],
  ]) {
    const verdict = sweepVerdict({ ...landed, ...change });
    assert.equal(verdict.remove, false);
    assert.equal(verdict.reason, reason);
  }
});

test("removing a worktree takes the docs link away without touching the shared docs", () => {
  const dir = mkdtempSync(join(tmpdir(), "floc-remove-"));
  try {
    const git = (cwd, ...args) => assert.equal(spawnSync("git", args, { cwd, encoding: "utf8" }).status, 0);
    const main = join(dir, "main");
    mkdirSync(main);
    git(main, "init", "-q", "-b", "develop");
    writeFileSync(join(main, ".gitignore"), "/docs\n");
    git(main, "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-q", "--allow-empty", "-m", "start");
    mkdirSync(join(main, "docs"));
    writeFileSync(join(main, "docs", "page.html"), "keep");
    const worktree = join(dir, "wt");
    git(main, "worktree", "add", "-q", "-b", "feature/a", worktree);
    symlinkSync(join(main, "docs"), join(worktree, "docs"), "junction");
    removeWorktree(main, worktree, "feature/a");
    assert.equal(existsSync(worktree), false);
    assert.equal(readFileSync(join(main, "docs", "page.html"), "utf8"), "keep");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

const scratch = { managed: true, scratch: true, contained: true, idleHours: 48 };

test("a subagent or detached worktree with nothing of its own is removed once idle for a day", () => {
  assert.equal(sweepVerdict(scratch).remove, true);
  assert.equal(sweepVerdict({ ...scratch, release: true, idleHours: 1 }).remove, true);
  for (const [change, reason] of [
    [{ dirty: true }, "uncommitted changes"],
    [{ contained: false }, "commits not on develop or main"],
    [{ idleHours: 2 }, "used in the last 24 hours"],
  ]) {
    const verdict = sweepVerdict({ ...scratch, ...change });
    assert.equal(verdict.remove, false);
    assert.equal(verdict.reason, reason);
  }
});

test("only task branches wait for a pull request; any other branch is scratch", () => {
  assert.equal(isScratch("feature/a"), false);
  assert.equal(isScratch("release/0.214.0"), false);
  assert.equal(isScratch("worktree-agent-a03ff"), true);
  assert.equal(isScratch(null), true);
});

test("a branch with no worktree goes only when every commit is on develop or main", () => {
  assert.equal(branchVerdict({ name: "ci-fix", contained: true }).remove, true);
  assert.equal(branchVerdict({ name: "ci-fix", contained: false }).remove, false);
  assert.equal(branchVerdict({ name: "develop", contained: true }).remove, false);
  assert.equal(branchVerdict({ name: "feature/a", checkedOut: true, contained: true }).remove, false);
});
