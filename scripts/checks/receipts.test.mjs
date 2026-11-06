import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { reusable } from "./receipts.mjs";
import { commandFor, selectedChecks } from "./manifest.mjs";

test("changed inputs, security checks and missing outputs invalidate a receipt", () => {
  const dir = mkdtempSync(join(tmpdir(), "floc-receipt-"));
  try {
    const artifact = join(dir, "coverage");
    const receipt = { fingerprint: "same", finishedAt: new Date().toISOString(), artifacts: [artifact] };
    assert.equal(reusable(receipt, "same", {}), false);
    writeFileSync(artifact, "coverage");
    assert.equal(reusable(receipt, "same", {}), true);
    assert.equal(reusable(receipt, "changed", {}), false);
    assert.equal(reusable(receipt, "same", { fresh: true }), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

const ids = (profile, paths) => selectedChecks(profile, paths).map((c) => c.id);

test("a push runs only what the diff needs; a release runs everything it touches", () => {
  const scriptOnly = ids("quick", ["scripts/workspace.mjs"]);
  assert.ok(scriptOnly.includes("tool-tests") && scriptOnly.includes("repository"));
  assert.ok(!scriptOnly.includes("web-source"));
  assert.ok(ids("quick", ["floc/apps/web/src/a.tsx"]).includes("web-source"));
  assert.ok(!ids("quick", ["floc/apps/web/src/a.tsx"]).includes("tool-tests"));
  assert.ok(!ids("pr", ["floc/apps/web/src/a.tsx"]).includes("web-journeys"));
  const release = ids("release", ["floc/packages/floc-core/src/money/money.ts"]);
  for (const id of ["web-journeys", "mobile-bundles", "audit", "build"]) assert.ok(release.includes(id), id);
  assert.deepEqual(ids("coverage", []), ["tests"]);
});

test("local tests reuse the Turbo cache; CI forces fresh coverage; quick and PR runs filter to affected packages", () => {
  const tests = selectedChecks("coverage", []).find((c) => c.id === "tests");
  assert.ok(!commandFor(tests, "quick", "abc").includes("--force"));
  assert.ok(commandFor(tests, "quick", "abc").includes("--filter=...[abc]"));
  assert.ok(commandFor(tests, "pr", "abc").includes("--force"));
  assert.ok(!commandFor(tests, "release", "abc").some((a) => a.startsWith("--filter")));
  const args = commandFor(tests, "pr", "abc");
  assert.ok(args.indexOf("--filter=...[abc]") < args.indexOf("--"));
});
