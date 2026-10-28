import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { lintSources } from "./lint.mjs";

const lintOne = async (t, name, code, ...rest) => {
  const root = mkdtempSync(join(tmpdir(), "floc-lint-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(join(root, name), code);
  return lintSources(root, [name], ...rest);
};
const FS = "security/detect-non-literal-fs-filename";
const fromArgv = 'import { readFileSync } from "node:fs";\nconst path = process.argv[2];\n';

test("local analysis catches an array reduction without an initial value", async (t) => {
  const issues = await lintOne(t, "example.ts", "const values: number[] = []; export const total = values.reduce((a, b) => a + b);\n");
  assert.ok(issues.some((issue) => /reduce/.test(issue.ruleId)));
});

test("dynamic file paths are flagged where the file reads untrusted input", async (t) => {
  const issues = await lintOne(t, "example.ts", fromArgv + "export const text = readFileSync(path);\n");
  assert.ok(issues.some((issue) => issue.ruleId === FS));
});

test("dynamic file paths pass in a file that reads no untrusted input", async (t) => {
  const issues = await lintOne(t, "example.ts", 'import { readFileSync } from "node:fs"; export function read(path: string) { return readFileSync(path); }\n');
  assert.ok(!issues.some((issue) => issue.ruleId === FS));
});

test("a dynamic path in a function that reads no untrusted input passes", async (t) => {
  const code = fromArgv + "export function read(file: string) { return readFileSync(file); }\nexport const text = read(path.slice(0, 0) + \"a.txt\");\n";
  const issues = await lintOne(t, "example.ts", code);
  assert.ok(!issues.some((issue) => issue.ruleId === FS));
});

test("a reviewed path passes with a Why: comment on the line above", async (t) => {
  const issues = await lintOne(t, "example.ts", fromArgv + "// Why: checked against the root above.\nexport const text = readFileSync(path);\n");
  assert.deepEqual(issues, []);
});

test("an eslint-disable comment does not hide a finding", async (t) => {
  const issues = await lintOne(t, "example.ts", fromArgv + "// eslint-disable-next-line " + FS + " -- checked\nexport const text = readFileSync(path);\n");
  assert.ok(issues.some((issue) => issue.ruleId === FS));
});

test("a rule Sonar ignores for the path does not block", async (t) => {
  const code = 'import { execFileSync } from "node:child_process"; export const out = execFileSync("git", ["status"]);\n';
  const issues = await lintOne(t, "tool.ts", code, undefined, (path, rule) => path === "tool.ts" && rule === "S4036");
  assert.ok(!issues.some((issue) => issue.ruleId === "sonarjs/no-os-command-from-path"));
});

test("studio JavaScript is checked rather than hidden by package ignores", async (t) => {
  const issues = await lintOne(t, "scene.js", "export const result = true ? 1 : 1;\n");
  assert.ok(issues.some((issue) => issue.ruleId === "sonarjs/no-all-duplicated-branches"));
});

test("unchanged legacy findings do not block a different edited line", async (t) => {
  const code = "export const old = [1].reduce((a, b) => a + b);\nexport const changed = 2;\n";
  const issues = await lintOne(t, "example.ts", code, new Map([["example.ts", new Set([2])]]));
  assert.deepEqual(issues, []);
});
