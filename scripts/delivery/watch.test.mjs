import { test } from "node:test";
import assert from "node:assert/strict";
import { nextStep } from "./watch.mjs";

const open = { state: "OPEN", mergeable: "MERGEABLE", autoMergeRequest: { enabledAt: "now" } };
const pending = { state: "pending", failed: [] };
const passed = { state: "passed", failed: [] };

test("an open PR waits for its checks, stops on a failure and syncs on a conflict", () => {
  assert.equal(nextStep({ target: "develop", pr: open, checks: pending }).do, "wait");
  assert.deepEqual(nextStep({ target: "develop", pr: open, checks: { state: "failed", failed: ["PR checks"] } }), { do: "stop", why: "checks failed: PR checks" });
  assert.equal(nextStep({ target: "develop", pr: { ...open, mergeable: "CONFLICTING" }, checks: pending }).do, "sync");
});

test("the watcher merges only when GitHub auto-merge is off and every required check passed", () => {
  assert.equal(nextStep({ target: "develop", pr: { ...open, autoMergeRequest: null }, checks: passed }).do, "merge");
  assert.equal(nextStep({ target: "develop", pr: open, checks: passed }).do, "wait");
  assert.equal(nextStep({ target: "develop", pr: { ...open, autoMergeRequest: null, mergeable: "UNKNOWN" }, checks: passed }).do, "wait");
});

test("work merged into develop is finished only once develop CI is green on the merge", () => {
  const merged = { state: "MERGED" };
  assert.equal(nextStep({ target: "develop", pr: merged, landed: pending }).do, "wait");
  assert.equal(nextStep({ target: "develop", pr: merged, landed: passed }).do, "finish");
  assert.equal(nextStep({ target: "develop", pr: merged, landed: { state: "failed", failed: ["Release checks"] } }).do, "stop");
});

test("a release is finished only when production serves the merge, and gives up after 45 minutes", () => {
  const merged = { state: "MERGED" };
  assert.equal(nextStep({ target: "main", pr: merged, deploy: { state: "pending" }, mergedFor: 60_000 }).do, "wait");
  assert.equal(nextStep({ target: "main", pr: merged, deploy: { state: "passed" } }).do, "finish");
  assert.equal(nextStep({ target: "main", pr: merged, deploy: { state: "failed", reason: "x" } }).do, "stop");
  assert.equal(nextStep({ target: "main", pr: merged, deploy: { state: "pending" }, mergedFor: 46 * 60_000 }).do, "stop");
});

test("a PR closed without merging stops the watcher", () => {
  assert.equal(nextStep({ target: "develop", pr: { state: "CLOSED" }, checks: pending }).do, "stop");
});
