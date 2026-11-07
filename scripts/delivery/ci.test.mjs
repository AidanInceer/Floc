import { test } from "node:test";
import assert from "node:assert/strict";
import { prStep } from "./ci.mjs";

const open = { state: "OPEN", mergeable: "MERGEABLE", autoMergeRequest: { enabledAt: "now" } };
const pending = { state: "pending", failed: [] };
const passed = { state: "passed", failed: [] };

test("an open PR waits for its checks and reports a failure or a conflict", () => {
  assert.equal(prStep({ pr: open, checks: pending }).do, "wait");
  assert.deepEqual(prStep({ pr: open, checks: { state: "failed", failed: ["PR checks"] } }), { do: "report", state: "failed", failed: ["PR checks"] });
  assert.equal(prStep({ pr: { ...open, mergeable: "CONFLICTING" }, checks: pending }).state, "conflict");
});

test("it merges only when GitHub auto-merge is off and every required check passed", () => {
  assert.equal(prStep({ pr: { ...open, autoMergeRequest: null }, checks: passed }).do, "merge");
  assert.equal(prStep({ pr: open, checks: passed }).do, "wait");
  assert.equal(prStep({ pr: { ...open, autoMergeRequest: null, mergeable: "UNKNOWN" }, checks: passed }).do, "wait");
});

test("a merged or closed PR is reported as it is", () => {
  assert.equal(prStep({ pr: { state: "MERGED" }, checks: pending }).state, "merged");
  assert.equal(prStep({ pr: { state: "CLOSED" }, checks: pending }).state, "closed");
});
