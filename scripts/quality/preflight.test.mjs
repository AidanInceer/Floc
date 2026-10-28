import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { assertPreflight, recordPreflight, workingTree } from "./preflight.mjs";

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), "floc-preflight-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git("init", "-q");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.invalid");
  writeFileSync(join(root, "source.ts"), "export const a = 1;\n");
  git("add", ".");
  git("commit", "-qm", "baseline");
  git("update-ref", "refs/remotes/origin/main", "HEAD");
  git("update-ref", "refs/remotes/origin/develop", "HEAD");
  return { root, git };
}

test("push refuses a commit that never passed preflight", (t) => {
  const f = fixture(t);
  assert.throws(() => assertPreflight(f.root, workingTree(f.root)), /preflight/i);
});

test("committing verified content keeps the preflight valid", (t) => {
  const f = fixture(t);
  writeFileSync(join(f.root, "source.ts"), "export const a = 2;\n");
  recordPreflight(f.root, workingTree(f.root));
  f.git("commit", "-qam", "verified change");
  assert.doesNotThrow(() => assertPreflight(f.root, f.git("rev-parse", "HEAD^{tree}")));
});

test("edits after a green preflight invalidate it", (t) => {
  const f = fixture(t);
  recordPreflight(f.root, workingTree(f.root));
  writeFileSync(join(f.root, "source.ts"), "export const a = 9;\n");
  assert.throws(() => assertPreflight(f.root, workingTree(f.root)), /stale|differs/i);
});

test("a different staged selection cannot borrow a green preflight", (t) => {
  const f = fixture(t);
  writeFileSync(join(f.root, "source.ts"), "export const a = 2;\n");
  recordPreflight(f.root, workingTree(f.root));
  assert.throws(() => assertPreflight(f.root, f.git("write-tree")), /differs/i);
});

test("a moved release base invalidates the preflight", (t) => {
  const f = fixture(t);
  recordPreflight(f.root, workingTree(f.root));
  f.git("commit", "--allow-empty", "-qm", "new main");
  f.git("update-ref", "refs/remotes/origin/main", "HEAD");
  assert.throws(() => assertPreflight(f.root, workingTree(f.root)), /stale/i);
});

test("another develop push invalidates the preflight", (t) => {
  const f = fixture(t);
  recordPreflight(f.root, workingTree(f.root));
  assert.throws(() => assertPreflight(f.root, workingTree(f.root), "1".repeat(40)), /stale/i);
});
