import { test } from "node:test";
import assert from "node:assert/strict";
import { changedLines } from "./review.mjs";

const at = (start, context) => [
  "diff --git a/floc/apps/web/a.tsx b/floc/apps/web/a.tsx",
  "index 1111..2222 100644",
  "--- a/floc/apps/web/a.tsx",
  "+++ b/floc/apps/web/a.tsx",
  `@@ -${start},1 +${start},1 @@ ${context}`,
  "-  return <p>old</p>;",
  "+  return <p>new</p>;",
].join("\n");

test("a review still matches after develop moves the lines around the change", () => {
  assert.equal(changedLines(at(10, "function A() {")), changedLines(at(42, "function B() {")));
});

test("a different change no longer matches", () => {
  assert.notEqual(changedLines(at(10, "x")), changedLines(at(10, "x").replace("new", "newer")));
});
