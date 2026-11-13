import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test } from "node:test";

import { wireframeTarget } from "./delete.mjs";

// Why: an absolute root on whatever platform runs the test; CI is Linux, where "C:" is not absolute.
const root = resolve(tmpdir(), "worktrees", "some-task");
const wireframe = join(root, "floc", "wireframe");

test("a folder name is taken inside floc/wireframe of the checkout it runs in", () => {
  assert.equal(wireframeTarget(root, "motion-map"), join(wireframe, "motion-map"));
});

test("a nested file and a repo-relative path both resolve inside floc/wireframe", () => {
  assert.equal(wireframeTarget(root, "_motion/real/map.mjs"), join(wireframe, "_motion", "real", "map.mjs"));
  assert.equal(wireframeTarget(root, "floc/wireframe/motion-menu/"), join(wireframe, "motion-menu"));
});

test("nothing outside floc/wireframe can be named", () => {
  assert.throws(() => wireframeTarget(root, "../apps/web"), /inside floc\/wireframe/);
  assert.throws(() => wireframeTarget(root, "motion-map/../../apps"), /inside floc\/wireframe/);
  assert.throws(() => wireframeTarget(root, join(root, "scripts")), /inside floc\/wireframe/);
});

test("the wireframe folder itself cannot be removed", () => {
  assert.throws(() => wireframeTarget(root, "."), /inside floc\/wireframe/);
  assert.throws(() => wireframeTarget(root, "floc/wireframe"), /inside floc\/wireframe/);
});
