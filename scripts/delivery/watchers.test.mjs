import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { isRunning, runsFrom, watchedPaths } from "./watchers.mjs";

test("the folder a watcher runs from is read from its .cmd file", () => {
  const cmd = '@echo off\r\ncd /d "C:\\dev\\Floc"\r\n"C:\\Program Files\\nodejs\\node.exe" "C:\\dev\\Floc\\.claude\\worktrees\\release-0.214.0\\scripts\\delivery\\watch.mjs" "--pr" "508"\r\n';
  assert.equal(runsFrom(cmd), resolve("C:\\dev\\Floc\\.claude\\worktrees\\release-0.214.0"));
  assert.equal(runsFrom("@echo off\r\n"), null);
});

test("only a running watcher protects the worktrees it needs", () => {
  assert.equal(isRunning({ state: "waiting for checks" }), true);
  for (const state of ["done", "needs you", "stopped"]) assert.equal(isRunning({ state }), false);
  const paths = watchedPaths([
    { state: "waiting for checks", worktree: "C:\\W\\a", runsFrom: "C:\\W\\b" },
    { state: "done", worktree: "C:\\W\\c", runsFrom: null },
  ]);
  assert.deepEqual([...paths].sort(), [resolve("C:\\W\\a").toLowerCase(), resolve("C:\\W\\b").toLowerCase()]);
});
