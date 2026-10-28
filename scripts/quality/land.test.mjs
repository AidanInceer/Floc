import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { recordPreflight, workingTree } from "./preflight.mjs";

const source = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function fixture(t) {
  const directory = mkdtempSync(join(tmpdir(), "floc-land-"));
  t.after(() => rmSync(directory, { recursive: true, force: true }));
  const root = join(directory, "checkout");
  const remote = join(directory, "remote.git");
  mkdirSync(root);
  const git = (...args) => {
    const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git("init", "-q", "--initial-branch=develop");
  git("init", "--bare", "-q", remote);
  git("config", "user.name", "Test");
  git("config", "user.email", "test@example.invalid");
  mkdirSync(join(root, "scripts/quality"), { recursive: true });
  cpSync(join(source, "push.mjs"), join(root, "scripts/push.mjs"));
  for (const name of ["preflight.mjs", "changes.mjs"]) cpSync(join(source, "quality", name), join(root, "scripts/quality", name));
  mkdirSync(join(root, "floc/apps/web"), { recursive: true });
  writeFileSync(join(root, "floc/apps/web/package.json"), '{"version":"1.0.0"}\n');
  writeFileSync(join(root, "source.ts"), "export const a = 1;\n");
  git("add", ".");
  git("commit", "-qm", "baseline");
  git("remote", "add", "origin", remote);
  git("push", "-q", "origin", "HEAD:main", "HEAD:develop");
  const before = git("rev-parse", "origin/develop");
  writeFileSync(join(root, "source.ts"), "export const a = 2;\n");
  const message = join(directory, "message.txt");
  writeFileSync(message, "1.0.0 #no-ticket: chore: check local landing\n");
  const land = (args = []) => spawnSync(process.execPath, [join(root, "scripts/push.mjs"), "land", "--message-file", message, ...args], { cwd: root, encoding: "utf8" });
  const remoteDevelop = () => git("ls-remote", "origin", "refs/heads/develop").split(/\s/)[0];
  return { root, git, before, land, remoteDevelop };
}

test("push:land cannot reach develop without a successful preflight", (t) => {
  const f = fixture(t);
  const result = f.land();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /No successful preflight/);
  assert.equal(f.remoteDevelop(), f.before);
});

test("push:land sends the exact tree that passed preflight", (t) => {
  const f = fixture(t);
  recordPreflight(f.root, workingTree(f.root));
  const result = f.land();
  assert.equal(result.status, 0, result.stderr);
  assert.equal(f.remoteDevelop(), f.git("rev-parse", "HEAD"));
  assert.equal(readFileSync(join(f.root, "source.ts"), "utf8"), "export const a = 2;\n");
});

test("push:land refuses an edit made after preflight", (t) => {
  const f = fixture(t);
  recordPreflight(f.root, workingTree(f.root));
  writeFileSync(join(f.root, "source.ts"), "export const a = 99;\n");
  const result = f.land();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /stale|differs/);
  assert.equal(f.remoteDevelop(), f.before);
});

test("push:land --only refuses unrelated files already staged", (t) => {
  const f = fixture(t);
  writeFileSync(join(f.root, "unrelated.ts"), "export const b = 3;\n");
  f.git("add", "unrelated.ts");
  recordPreflight(f.root, workingTree(f.root));
  const result = f.land(["--only", "source.ts"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /staged|only/i);
  assert.equal(f.remoteDevelop(), f.before);
});
