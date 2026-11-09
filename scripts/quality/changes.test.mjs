import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { collectChanges, collectStaged } from "./changes.mjs";

test("release changes include earlier commits, staged edits and untracked source", (t) => {
  const root = mkdtempSync(join(tmpdir(), "floc-diff-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  };
  git("init", "-q");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.invalid");
  mkdirSync(join(root, "floc"));
  writeFileSync(join(root, "floc/a.ts"), "export const a = 1;\n");
  git("add", ".");
  git("commit", "-qm", "baseline");
  git("branch", "baseline");
  writeFileSync(join(root, "floc/a.ts"), "export const a = 2;\n");
  git("commit", "-qam", "earlier release change");
  writeFileSync(join(root, "floc/b.ts"), "export const b = 3;\n");
  git("add", ".");
  writeFileSync(join(root, "floc/c.ts"), "export const c = 4;\n");
  const changes = collectChanges(root, "baseline");
  assert.deepEqual([...changes.keys()].sort(), ["floc/a.ts", "floc/b.ts", "floc/c.ts"]);
  assert.deepEqual([...changes.get("floc/a.ts")], [1]);
});

test("staged changes list only staged lines of staged files", (t) => {
  const root = mkdtempSync(join(tmpdir(), "floc-staged-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const git = (...args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  };
  git("init", "-q");
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.invalid");
  mkdirSync(join(root, "floc/[id]"), { recursive: true });
  writeFileSync(join(root, "floc/a.ts"), "export const a = 1;\nexport const b = 1;\nexport const c = 1;\n");
  writeFileSync(join(root, "floc/gone.ts"), "export const g = 1;\n");
  git("add", ".");
  git("commit", "-qm", "baseline");
  writeFileSync(join(root, "floc/a.ts"), "export const a = 2;\nexport const b = 1;\nexport const c = 1;\n");
  writeFileSync(join(root, "floc/[id]/new.ts"), "export const n = 1;\nexport const m = 1;\n");
  git("rm", "-q", "floc/gone.ts");
  git("add", ".");
  writeFileSync(join(root, "floc/a.ts"), "export const a = 2;\nexport const b = 1;\nexport const c = 9;\n");
  writeFileSync(join(root, "floc/loose.ts"), "export const l = 1;\n");
  const changes = collectStaged(root);
  assert.deepEqual([...changes.keys()].sort(), ["floc/[id]/new.ts", "floc/a.ts"]);
  assert.deepEqual([...changes.get("floc/a.ts")], [1]);
  assert.deepEqual([...changes.get("floc/[id]/new.ts")], [1, 2]);
});
