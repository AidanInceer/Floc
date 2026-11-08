import { test } from "node:test";
import assert from "node:assert/strict";
import { ruleset } from "./policy.mjs";

const rule = (set, type) => set.rules.find((r) => r.type === type);
const types = (set) => set.rules.map((r) => r.type);

test("main takes merge commits from PRs only, with strict release checks", () => {
  const main = ruleset("main");
  assert.deepEqual(rule(main, "pull_request").parameters.allowed_merge_methods, ["merge"]);
  assert.equal(rule(main, "required_status_checks").parameters.strict_required_status_checks_policy, true);
  assert.ok(rule(main, "required_status_checks").parameters.required_status_checks.some((c) => c.context === "Release checks"));
});

test("develop is only guarded against deletion and force-push, so Sync develop can push to it", () => {
  assert.deepEqual(types(ruleset("develop")), ["deletion", "non_fast_forward"]);
});

test("no ruleset names a bypass actor, which a personal-account repo cannot use", () => {
  for (const branch of ["develop", "main"]) assert.deepEqual(ruleset(branch).bypass_actors, []);
});
