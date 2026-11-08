import { test } from "node:test";
import assert from "node:assert/strict";
import { landedLabels } from "./github.mjs";

test("a landed ticket gains on-develop and loses in-progress, so a parallel pickup sees it free of a session", () => {
  assert.deepEqual(landedLabels("540"), ["issue", "edit", "540", "--add-label", "on-develop", "--remove-label", "in-progress"]);
});
