import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { freezeScripts } from "./schedule.mjs";

test("a watcher runs from a frozen copy of the scripts, so removing the worktree cannot pull them away", () => {
  const dir = mkdtempSync(join(tmpdir(), "floc-freeze-"));
  try {
    const scripts = join(dir, "worktree", "scripts");
    for (const part of ["delivery", "workspace"]) {
      mkdirSync(join(scripts, part), { recursive: true });
      writeFileSync(join(scripts, part, "a.mjs"), "export {};");
      writeFileSync(join(scripts, part, "a.test.mjs"), "export {};");
    }
    const copy = freezeScripts(scripts, join(dir, "watch"), "feature-a");
    rmSync(join(dir, "worktree"), { recursive: true });
    assert.equal(existsSync(join(copy, "delivery", "a.mjs")), true);
    assert.equal(existsSync(join(copy, "workspace", "a.mjs")), true);
    assert.equal(existsSync(join(copy, "delivery", "a.test.mjs")), false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
