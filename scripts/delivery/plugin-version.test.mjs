import { test } from "node:test";
import assert from "node:assert/strict";
import { nextPluginVersion } from "./plugin-version.mjs";

test("a branch level with the target takes the next minor version", () => {
  assert.equal(nextPluginVersion("0.22.0", "0.22.0"), "0.23.0");
});

test("a branch behind the target moves past the target, not past itself", () => {
  assert.equal(nextPluginVersion("0.21.3", "0.24.0"), "0.25.0");
});

test("a branch already past the target keeps its version", () => {
  assert.equal(nextPluginVersion("0.23.0", "0.22.0"), null);
  assert.equal(nextPluginVersion("1.0.0", "0.30.0"), null);
});
