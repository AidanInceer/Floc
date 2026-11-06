import { test } from "node:test";
import assert from "node:assert/strict";
import { copyFileSync, mkdirSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function run(env) {
  const root = mkdtempSync(join(tmpdir(), "floc-docs-test-"));
  try {
    mkdirSync(join(root, "scripts"));
    copyFileSync(new URL("./check-docs.mjs", import.meta.url), join(root, "scripts/check-docs.mjs"));
    return spawnSync(process.execPath, ["scripts/check-docs.mjs"], { cwd: root, encoding: "utf8", env: { ...process.env, CI: "", ...env } });
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("a local checkout without the docs link fails", () => {
  const result = run({});
  assert.equal(result.status, 1);
  assert.match(result.stderr, /workspace:prepare/);
});

test("CI has no docs and skips the check", () => {
  const result = run({ CI: "true" });
  assert.equal(result.status, 0);
});

