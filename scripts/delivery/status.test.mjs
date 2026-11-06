import { test } from "node:test";
import assert from "node:assert/strict";
import { deployedStatus, requiredStatus, sonarStatus } from "./status.mjs";
import { closedBy, splitChildren, withoutTickets } from "./github.mjs";
import { docsPaths } from "./docs.mjs";

const run = (conclusion) => [{ name: "Release checks", status: "completed", conclusion }];

test("only success passes a required check; cancelled waits; skipped, neutral and failure fail", () => {
  assert.equal(requiredStatus(run("success"), ["Release checks"]).state, "passed");
  assert.equal(requiredStatus(run("cancelled"), ["Release checks"]).state, "pending");
  for (const conclusion of ["skipped", "neutral", "timed_out", "failure"]) {
    assert.equal(requiredStatus(run(conclusion), ["Release checks"]).state, "failed");
  }
  assert.equal(requiredStatus([], ["Release checks"]).state, "pending");
  assert.equal(requiredStatus([...run("success"), { name: "optional", status: "completed", conclusion: "skipped" }], ["Release checks"]).state, "passed");
});

test("live means production reports the merge commit and the homepage loads", () => {
  assert.equal(deployedStatus({ healthSha: "new", homeOk: true }, "new").state, "passed");
  assert.equal(deployedStatus({ healthSha: "old", homeOk: true }, "new").state, "pending");
  assert.equal(deployedStatus({ healthSha: "new", homeOk: false }, "new").state, "failed");
  assert.equal(deployedStatus({ healthSha: "old", github: "failure" }, "new").state, "failed");
});

test("a Sonar result counts only for the commit it analysed", () => {
  assert.equal(sonarStatus({ revision: "old", status: "OK" }, "new").state, "pending");
  assert.equal(sonarStatus({ revision: "new", status: "ERROR" }, "new").state, "failed");
});

test("tickets come from Closes lines, leave the Priority stack renumbered, and split parents list their children", () => {
  assert.deepEqual(closedBy("x\nCloses AidanInceer/Floc#12\nCloses AidanInceer/Floc#12\nCloses AidanInceer/Floc#4"), ["12", "4"]);
  assert.equal(withoutTickets("1. #4 a\n2. #12 b\n3. #9 c", ["12"]), "1. #4 a\n2. #9 c");
  assert.deepEqual(splitChildren("Why\n## Split into\n- #20\n- #21\n## Notes\n#99"), ["20", "21"]);
});

test("docs pages are committed relative to the docs clone", () => {
  assert.deepEqual(docsPaths(["docs/process/lifecycle.html", "docs\\engineering\\ci.html", "process/lifecycle.html"]), ["process/lifecycle.html", "engineering/ci.html"]);
});

test("auto-merge is used only when GitHub will wait for required checks", async () => {
  const { waitsForChecks } = await import("./github.mjs");
  const required = [{ type: "pull_request" }, { type: "required_status_checks" }];
  assert.equal(waitsForChecks({ allowAutoMerge: true, rules: required }), true);
  assert.equal(waitsForChecks({ allowAutoMerge: false, rules: required }), false);
  assert.equal(waitsForChecks({ allowAutoMerge: true, rules: [{ type: "deletion" }] }), false);
  assert.equal(waitsForChecks({ allowAutoMerge: true, rules: [] }), false);
});
