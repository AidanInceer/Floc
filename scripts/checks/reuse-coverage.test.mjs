import { test } from "node:test";
import assert from "node:assert/strict";
import { pickArtifact, pickPull, pickRun } from "./reuse-coverage.mjs";

test("only a merged PR into main counts", () => {
  assert.equal(pickPull([{ merged_at: null, base: { ref: "main" } }, { merged_at: "x", base: { ref: "develop" } }]), undefined);
  assert.equal(pickPull([{ merged_at: "x", base: { ref: "main" }, n: 1 }]).n, 1);
});

test("only a passed pull request run counts", () => {
  assert.equal(pickRun([{ conclusion: "failure", event: "pull_request" }, { conclusion: "success", event: "push" }]), undefined);
  assert.equal(pickRun([{ conclusion: "success", event: "pull_request", id: 7 }]).id, 7);
});

test("an expired or unrelated artifact is skipped", () => {
  assert.equal(pickArtifact([{ name: "coverage-a", expired: true }, { name: "failed-checks-a", expired: false }]), undefined);
  assert.equal(pickArtifact([{ name: "coverage-a", expired: false }]).name, "coverage-a");
});
