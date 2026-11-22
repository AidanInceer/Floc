import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { nextVersion, releaseBody, releaseHead } from "./release.mjs";
import { git } from "./process.mjs";

const PACKAGE = "floc/apps/web/package.json";

function repository(t) {
  const root = mkdtempSync(join(tmpdir(), "floc-release-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  git(root, "init", "--quiet", "-b", "develop");
  git(root, "config", "user.name", "Test");
  git(root, "config", "user.email", "test@example.com");
  mkdirSync(join(root, "floc/apps/web"), { recursive: true });
  writeFileSync(join(root, PACKAGE), JSON.stringify({ name: "floc-web", version: "1.2.0" }, null, 2));
  git(root, "add", ".");
  git(root, "commit", "--quiet", "-m", "Start");
  return root;
}

const version = (root, ref) => JSON.parse(git(root, "show", `${ref}:${PACKAGE}`)).version;
const parents = (root, ref) => git(root, "rev-list", "--parents", "-n", "1", ref).split(" ").slice(1);

test("a new release branch is develop with the version set", (t) => {
  const root = repository(t);
  const develop = git(root, "rev-parse", "HEAD");
  const head = releaseHead(root, { develop, branch: null, version: "1.3.0" });
  assert.deepEqual(parents(root, head), [develop]);
  assert.equal(version(root, head), "1.3.0");
});

test("a reused release branch takes the newer develop in by merge and keeps its version", (t) => {
  const root = repository(t);
  const first = git(root, "rev-parse", "HEAD");
  const branch = releaseHead(root, { develop: first, branch: null, version: "1.3.0" });
  writeFileSync(join(root, "fix.txt"), "fixed");
  git(root, "add", ".");
  git(root, "commit", "--quiet", "-m", "Fix");
  const develop = git(root, "rev-parse", "HEAD");
  const head = releaseHead(root, { develop, branch, version: "1.3.0" });
  assert.deepEqual(parents(root, head), [branch, develop]);
  assert.equal(version(root, head), "1.3.0");
  assert.equal(git(root, "show", `${head}:fix.txt`), "fixed");
});

test("a reused release branch that already holds develop is left as it is", (t) => {
  const root = repository(t);
  const develop = git(root, "rev-parse", "HEAD");
  const branch = releaseHead(root, { develop, branch: null, version: "1.3.0" });
  assert.equal(releaseHead(root, { develop, branch, version: "1.3.0" }), null);
});

test("a release takes one version: minor for any feat, patch otherwise", () => {
  assert.equal(nextVersion("0.211.0", "0.211.0", ["#12: fix: a", "#no-ticket: feat: b"]), "0.212.0");
  assert.equal(nextVersion("0.211.3", "0.211.3", ["#12: fix: a", "#no-ticket: chore: b"]), "0.211.4");
  assert.equal(nextVersion("0.211.0", "0.211.0", ["0.212.0 #12: feat: legacy subject"]), "0.212.0");
});

test("a develop already bumped the old way keeps its version", () => {
  assert.equal(nextVersion("0.211.0", "0.214.0", ["#1: fix: a"]), "0.214.0");
  assert.equal(nextVersion("0.211.0", "0.210.0", ["#1: fix: a"]), "0.211.1");
});

test("the release PR names its tickets, other commits and migrations", () => {
  const body = releaseBody({ tickets: [{ number: "5", title: "Trip notes" }], others: ["#no-ticket: chore: tidy"], migrations: [] });
  assert.match(body, /- #5 Trip notes/);
  assert.match(body, /- #no-ticket: chore: tidy/);
  assert.match(body, /Schema migrations: none/);
});
