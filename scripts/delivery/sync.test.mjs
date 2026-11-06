import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mechanical, mergeTarget } from "./sync.mjs";

// Why: git may check files out with CRLF on Windows.
const read = (path) => readFileSync(path, "utf8").replaceAll("\r\n", "\n");

test("only regenerated files are settled without a person", () => {
  assert.equal(mechanical(["pnpm-lock.yaml"]), true);
  assert.equal(mechanical(["pnpm-lock.yaml", "floc/apps/web/src/a.ts"]), false);
  assert.equal(mechanical([]), false);
});

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "floc-sync-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (cwd, ...args) => {
    const result = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
  };
  git(dir, "init", "-q", "--bare", "-b", "develop", "origin.git");
  git(dir, "clone", "-q", "origin.git", "a");
  const a = join(dir, "a");
  writeFileSync(join(a, "app.ts"), "one\n");
  git(a, "add", ".");
  git(a, "commit", "-qm", "start");
  git(a, "push", "-q", "origin", "HEAD:develop");
  git(a, "checkout", "-qb", "feature/x");
  return { dir, a, git };
}

test("a code conflict is left for a person and the branch is untouched", (t) => {
  const { dir, a, git } = fixture(t);
  writeFileSync(join(a, "app.ts"), "mine\n");
  git(a, "commit", "-qam", "mine");
  git(dir, "clone", "-q", "-b", "develop", "origin.git", "b");
  writeFileSync(join(dir, "b", "app.ts"), "theirs\n");
  git(join(dir, "b"), "commit", "-qam", "theirs");
  git(join(dir, "b"), "push", "-q", "origin", "develop");
  const result = mergeTarget(a, "develop");
  assert.deepEqual(result, { state: "conflict", files: ["app.ts"] });
  assert.equal(read(join(a, "app.ts")), "mine\n");
});

test("a branch already holding develop needs nothing, and a clean merge needs no force push", (t) => {
  const { dir, a, git } = fixture(t);
  assert.equal(mergeTarget(a, "develop").state, "current");
  git(dir, "clone", "-q", "-b", "develop", "origin.git", "b");
  writeFileSync(join(dir, "b", "other.ts"), "new\n");
  git(join(dir, "b"), "add", ".");
  git(join(dir, "b"), "commit", "-qm", "other");
  git(join(dir, "b"), "push", "-q", "origin", "develop");
  assert.equal(mergeTarget(a, "develop").state, "merged");
  assert.equal(read(join(a, "other.ts")), "new\n");
});
