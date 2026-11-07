import { test } from "node:test";
import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import { kindOf, stateOf, table } from "./list.mjs";

const main = resolve("/dev/Floc");
const worktree = (name) => join(main, ".claude", "worktrees", name);

test("each worktree is sorted into main, task, release, scratch or another tool's", () => {
  assert.equal(kindOf({ path: main, branch: "develop" }, main), "main");
  assert.equal(kindOf({ path: worktree("a"), branch: "feature/a" }, main), "task");
  assert.equal(kindOf({ path: worktree("release-0.2.0"), branch: null }, main), "release");
  assert.equal(kindOf({ path: worktree("agent-1"), branch: "worktree-agent-1" }, main), "scratch");
  assert.equal(kindOf({ path: resolve("/home/a/.t3/worktrees/Floc/t3-1"), branch: "t3/x" }, main), "other tool");
});

test("a row says what the work waits on, watcher first", () => {
  assert.equal(stateOf({ kind: "main", dirty: 3, behind: 2 }), "3 changed files; 2 commits behind develop");
  assert.equal(stateOf({ kind: "main" }), "current with develop");
  assert.equal(stateOf({ kind: "task", watcher: { state: "needs you", detail: "checks failed" } }), "watcher: needs you (checks failed)");
  assert.equal(stateOf({ kind: "task", pr: { number: 9, state: "OPEN" } }), "PR #9 open");
  assert.equal(stateOf({ kind: "task", pr: { number: 9, state: "MERGED" }, ahead: 0 }), "PR #9 landed; sweep removes it");
  assert.equal(stateOf({ kind: "task", dirty: 4 }), "4 unsaved changes");
  assert.equal(stateOf({ kind: "task", ahead: 2 }), "2 commits not on develop");
  assert.equal(stateOf({ kind: "scratch" }), "nothing of its own");
});

test("the table lines its columns up", () => {
  const rows = [{ where: "a", kind: "task", branch: "feature/a", age: "1 hour ago" }, { where: "longer", kind: "scratch", branch: null, age: "2 days ago" }];
  const lines = table(rows).split("\n");
  assert.equal(lines.length, 3);
  assert.equal(lines[1].indexOf("task"), lines[0].indexOf("kind"));
  assert.match(lines[2], /\(detached\)/);
});
