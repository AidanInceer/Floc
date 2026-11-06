import { test } from "node:test";
import assert from "node:assert/strict";
import { lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ensureDocs } from "./docs-link.mjs";

test("a worktree links to the main checkout's docs, and a second run leaves the link alone", () => {
  const dir = mkdtempSync(join(tmpdir(), "floc-docs-link-"));
  try {
    const main = join(dir, "main");
    const worktree = join(dir, "wt");
    mkdirSync(join(main, "docs"), { recursive: true });
    mkdirSync(worktree);
    writeFileSync(join(main, "docs", "index.html"), "shared");
    assert.equal(ensureDocs(worktree, main, { primary: false }).state, "linked");
    assert.equal(lstatSync(join(worktree, "docs")).isSymbolicLink(), true);
    assert.equal(readFileSync(join(worktree, "docs", "index.html"), "utf8"), "shared");
    assert.equal(ensureDocs(worktree, main, { primary: false }).state, "linked");
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("missing docs say how to get them instead of failing silently", () => {
  const dir = mkdtempSync(join(tmpdir(), "floc-docs-link-"));
  try {
    const result = ensureDocs(join(dir, "wt"), join(dir, "main"), { primary: false });
    assert.equal(result.state, "missing");
    assert.match(result.next, /gh repo clone AidanInceer\/floc-docs/);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
