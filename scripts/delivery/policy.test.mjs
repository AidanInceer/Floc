import { test } from "node:test";
import assert from "node:assert/strict";
import { ruleset } from "./policy.mjs";

const rule = (set, type) => set.rules.find((r) => r.type === type);

test("develop needs passing PR checks but no re-test after every other merge; main needs both", () => {
  const develop = ruleset("develop");
  const main = ruleset("main");
  assert.equal(rule(develop, "required_status_checks").parameters.strict_required_status_checks_policy, false);
  assert.equal(rule(main, "required_status_checks").parameters.strict_required_status_checks_policy, true);
  assert.ok(rule(develop, "required_status_checks").parameters.required_status_checks.some((c) => c.context === "PR checks"));
  assert.ok(rule(main, "required_status_checks").parameters.required_status_checks.some((c) => c.context === "Release checks"));
});

test("both branches take merge commits from PRs only, and only GitHub Actions may bypass", () => {
  for (const branch of ["develop", "main"]) {
    const set = ruleset(branch);
    assert.deepEqual(rule(set, "pull_request").parameters.allowed_merge_methods, ["merge"]);
    assert.ok(rule(set, "deletion") && rule(set, "non_fast_forward"));
    assert.deepEqual(set.bypass_actors.map((a) => a.actor_type), ["Integration"]);
  }
});
