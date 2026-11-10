import { test } from "node:test";
import assert from "node:assert/strict";
import { docLinks } from "./docs-links.mjs";

test("a skill's links into docs are found, with their anchors; other links are not", () => {
  const text = "See [CI](docs/process/lifecycle.html#ci), [push](../push/SKILL.md), [site](https://floc.live) and [ERD](docs/engineering/data-model.html).";
  assert.deepEqual(docLinks(text), ["docs/process/lifecycle.html#ci", "docs/engineering/data-model.html"]);
});
