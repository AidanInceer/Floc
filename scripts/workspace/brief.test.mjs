import { test } from "node:test";
import assert from "node:assert/strict";
import { briefLines } from "./brief.mjs";

const current = { primary: true, branch: "develop", dirty: 0, behind: 0, installed: "0.17.0", repo: "0.17.0", tasks: 0, watchers: 0 };

test("a current main checkout with nothing in flight says nothing", () => {
  assert.deepEqual(briefLines(current), []);
});

test("a stale or dirty main checkout is named before anything is built", () => {
  assert.match(briefLines({ ...current, dirty: 5, behind: 30 })[0], /5 changed tracked files and is 30 commits behind develop/);
  assert.match(briefLines({ ...current, dirty: 5 })[0], /belong in a worktree/);
  assert.match(briefLines({ ...current, branch: "feature/a" })[0], /not develop/);
  assert.match(briefLines({ ...current, pulled: 4, agentsChanged: true })[0], /moved forward 4 commits.*AGENTS\.md changed/);
});

test("stale cached skills say how to refresh them", () => {
  assert.match(briefLines({ ...current, installed: "0.15.0", repo: "0.17.0" })[0], /claude plugin update floc@floc --scope project/);
});

test("a worktree session hears where it is, and every session hears what is in flight", () => {
  const lines = briefLines({ ...current, primary: false, folder: "trip-notes", branch: "feature/trip-notes", behind: 3, tasks: 2, watchers: 1 });
  assert.match(lines[0], /worktree trip-notes on feature\/trip-notes, 3 commits behind develop/);
  assert.match(lines[1], /2 task worktrees, 1 watchers running/);
});
