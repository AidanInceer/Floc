import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { checkCoverage } from "./coverage.mjs";

function fixture(t, { hits = [1, 0], branches = [], report = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), "floc-quality-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const save = (file, text) => {
    mkdirSync(dirname(join(root, file)), { recursive: true });
    writeFileSync(join(root, file), text);
  };
  save("sonar-project.properties", "sonar.sources=floc\nsonar.javascript.lcov.reportPaths=floc/pkg/coverage/lcov.info\nsonar.coverage.exclusions=**/view/**\n");
  save("floc/pkg/src/rule.ts", "export const a = 1;\nexport const b = 2;\n");
  if (report) save("floc/pkg/coverage/lcov.info", `SF:src\\rule.ts\n${hits.map((hit, i) => `DA:${i + 1},${hit}`).join("\n")}\n${branches.join("\n")}\nend_of_record\n`);
  return { root, save, changes: new Map([["floc/pkg/src/rule.ts", new Set([1, 2])]]) };
}

test("package-wide coverage cannot hide untested release lines", (t) => {
  const f = fixture(t);
  const result = checkCoverage(f.root, f.changes);
  assert.equal(result.ok, false);
  assert.equal(result.percent, 50);
});

test("changed branches count even when every changed line ran", (t) => {
  const f = fixture(t, { hits: [1, 1], branches: ["BRDA:1,0,0,1", "BRDA:1,0,1,-"] });
  const result = checkCoverage(f.root, f.changes);
  assert.equal(result.percent, 75);
  assert.equal(result.ok, false);
});

test("missing coverage reports fail closed", (t) => {
  const f = fixture(t, { report: false });
  const result = checkCoverage(f.root, f.changes);
  assert.deepEqual(result.missing, ["floc/pkg/src/rule.ts"]);
  assert.equal(result.ok, false);
});

test("the shared Sonar UI exclusions still apply", (t) => {
  const f = fixture(t, { report: false });
  const result = checkCoverage(f.root, new Map([["floc/pkg/view/component.ts", new Set([1])]]));
  assert.equal(result.ok, true);
  assert.equal(result.total, 0);
});

test("uncovered old code does not lower new-code coverage", (t) => {
  const f = fixture(t, { hits: [0, 1] });
  const result = checkCoverage(f.root, new Map([["floc/pkg/src/rule.ts", new Set([2])]]));
  assert.equal(result.ok, true);
  assert.equal(result.percent, 100);
});

test("exactly 80 percent passes without rounding up a lower score", (t) => {
  const f = fixture(t, { hits: [1, 1, 1, 1, 0] });
  const result = checkCoverage(f.root, new Map([["floc/pkg/src/rule.ts", new Set([1, 2, 3, 4, 5])]]));
  assert.equal(result.ok, true);
  assert.equal(result.percent, 80);
});
