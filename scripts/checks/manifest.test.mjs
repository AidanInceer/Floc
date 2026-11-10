import { test } from "node:test";
import assert from "node:assert/strict";
import { commandFor, checks, onlyChecks, selectedChecks } from "./manifest.mjs";

const ids = (list) => list.map((c) => c.id);
const code = ["floc/apps/web/src/a.ts"];

test("wireframe-only PRs keep repository and secret checks without app checks", () => {
  const wireframe = "floc/wireframe/pick-a/tui.ts";
  assert.deepEqual(ids(selectedChecks("pr", [wireframe])), ["repository", "secrets"]);
  assert.deepEqual(ids(selectedChecks("pr", [...code, wireframe])), ids(selectedChecks("pr", code)));
});

test("the PR profile runs the cheap, often-red checks before tests and build", () => {
  const order = ids(selectedChecks("pr", code));
  const before = (a, b) => assert.ok(order.indexOf(a) < order.indexOf(b), `${a} before ${b}`);
  before("quality-lint", "tests");
  before("fitness-source", "tests");
  before("tests", "quality-coverage");
  before("tests", "build");
  before("build", "generated-types");
  before("build", "fitness-bundle");
});

test("--only keeps the manifest order and rejects an id that does not exist", () => {
  const picked = onlyChecks(selectedChecks("pr", code), ["build", "lint"]);
  assert.deepEqual(ids(picked), ["lint", "build"]);
  assert.throws(() => onlyChecks(selectedChecks("pr", code), ["nope"]), /nope/);
});

test("every PR check belongs to exactly one of the three CI jobs", () => {
  const jobs = ["repository,secrets,tool-tests,lint,types,quality-lint,fitness-source,migrations", "tests,quality-coverage", "build,generated-types,fitness-bundle"];
  const covered = jobs.flatMap((j) => j.split(","));
  assert.deepEqual([...covered].sort(), ids(selectedChecks("pr", code, true)).sort());
  assert.equal(new Set(covered).size, covered.length);
});

test("web is type-checked once in pr and release, after the build, and in quick runs by types", () => {
  const types = checks.find((c) => c.id === "types");
  assert.ok(commandFor(types, "pr", "abc").includes("--filter=!floc-web"));
  assert.ok(commandFor(types, "release", "abc").includes("--filter=!floc-web"));
  assert.ok(!commandFor(types, "quick", "abc").includes("--filter=!floc-web"));
});
