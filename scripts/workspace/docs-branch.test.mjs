import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureDocs, removeDocs } from "./docs-link.mjs";
import { landDocs } from "../delivery/docs.mjs";

const run = (cwd, ...args) => {
  const result = spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
};

function fixture(t) {
  const dir = mkdtempSync(join(tmpdir(), "floc-docs-branch-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  run(dir, "init", "-q", "--bare", "-b", "main", "origin.git");
  const main = join(dir, "main");
  mkdirSync(main);
  run(main, "clone", "-q", join(dir, "origin.git"), "docs");
  const docs = join(main, "docs");
  for (const [key, value] of [["user.name", "t"], ["user.email", "t@t"]]) run(docs, "config", key, value);
  writeFileSync(join(docs, "index.html"), "home\n");
  run(docs, "add", ".");
  run(docs, "commit", "-qm", "start");
  run(docs, "push", "-q", "origin", "HEAD:main");
  const task = (name) => { const root = join(dir, name); mkdirSync(root); return root; };
  return { dir, main, docs, task };
}

test("a task's docs are its own branch from main, so another session's unpushed page is not in them", (t) => {
  const { main, docs, task } = fixture(t);
  writeFileSync(join(docs, "half-done.html"), "another session\n");
  const root = task("a");
  assert.equal(ensureDocs(root, main, { primary: false, branch: "feature/a" }).state, "own");
  assert.equal(run(join(root, "docs"), "branch", "--show-current"), "docs/feature/a");
  assert.equal(existsSync(join(root, "docs", "index.html")), true);
  assert.equal(existsSync(join(root, "docs", "half-done.html")), false);
  assert.equal(ensureDocs(root, main, { primary: false, branch: "feature/a" }).state, "own");
});

test("two tasks land their pages on main at different times, merged, never rebased", (t) => {
  const { dir, main, task } = fixture(t);
  const a = task("a");
  const b = task("b");
  ensureDocs(a, main, { primary: false, branch: "feature/a" });
  ensureDocs(b, main, { primary: false, branch: "feature/b" });
  writeFileSync(join(a, "docs", "a.html"), "a\n");
  writeFileSync(join(b, "docs", "b.html"), "b\n");
  assert.deepEqual(landDocs(join(a, "docs"), "#1: feat: a"), ["a.html"]);
  assert.deepEqual(landDocs(join(b, "docs"), "#2: feat: b"), ["b.html"]);
  const check = join(dir, "check");
  run(dir, "clone", "-q", join(dir, "origin.git"), "check");
  assert.equal(readFileSync(join(check, "a.html"), "utf8").trim(), "a");
  assert.equal(readFileSync(join(check, "b.html"), "utf8").trim(), "b");
  assert.deepEqual(landDocs(join(a, "docs"), "#1: feat: a"), []);
});

test("a task's docs are removed only once every page has landed", (t) => {
  const { main, task } = fixture(t);
  const root = task("a");
  ensureDocs(root, main, { primary: false, branch: "feature/a" });
  writeFileSync(join(root, "docs", "a.html"), "a\n");
  assert.throws(() => removeDocs(main, root), /not on floc-docs main/);
  landDocs(join(root, "docs"), "#1: feat: a");
  removeDocs(main, root);
  assert.equal(existsSync(join(root, "docs")), false);
});
