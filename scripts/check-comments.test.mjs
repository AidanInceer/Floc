import assert from "node:assert/strict";
import { test } from "node:test";
import { findComments } from "./check-comments.mjs";

const found = (file, code) => findComments(file, code).map((c) => c.text);

test("a line comment is flagged", () => {
  assert.deepEqual(found("a.ts", "// note\nexport const a = 1;\n"), ["// note"]);
});

test("a trailing comment is flagged", () => {
  assert.deepEqual(found("a.ts", "export const a = 1; // note\n"), ["// note"]);
});

test("block and JSDoc comments are flagged", () => {
  assert.deepEqual(found("a.ts", "/** doc */\nexport const a = /* x */ 1;\n"), ["/** doc */", "/* x */"]);
});

test("a JSX comment is flagged", () => {
  assert.deepEqual(found("a.tsx", "export const A = () => <div>{/* note */}</div>;\n"), ["/* note */"]);
});

test("slashes inside strings, templates and regexes are not comments", () => {
  const code = 'export const u = "https://floc.app";\nexport const t = `//${u}`;\nexport const r = /https?:\\/\\//;\n';
  assert.deepEqual(found("a.ts", code), []);
});

test("tool directives pass", () => {
  const code = [
    "/// <reference types=\"node\" />",
    "// eslint-disable-next-line no-console",
    "// @ts-expect-error",
    "export const a: number = \"x\"; // NOSONAR",
    "",
  ].join("\n");
  assert.deepEqual(found("a.ts", code), []);
});

test("a shebang is not a comment", () => {
  assert.deepEqual(found("a.mjs", "#!/usr/bin/env node\nconsole.log(1);\n"), []);
});
