import { test } from "node:test";
import assert from "node:assert/strict";
import { worktreeVerdict } from "./finish.mjs";

test("a landed, clean worktree is removed; unsaved edits or unlanded commits keep it", () => {
  assert.deepEqual(worktreeVerdict({ dirty: false, contained: true }), { remove: true });
  assert.match(worktreeVerdict({ dirty: true, contained: true }).reason, /unsaved edits/);
  assert.match(worktreeVerdict({ dirty: false, contained: false }).reason, /did not land/);
});
