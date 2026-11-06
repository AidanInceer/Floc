import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { prepareConfig } from "./config.mjs";

test("workspace setup is repeatable and keeps credentials and resources local", async () => {
  const root = mkdtempSync(join(tmpdir(), "floc-workspace-"));
  const common = mkdtempSync(join(tmpdir(), "floc-registry-"));
  try {
    const first = await prepareConfig(root, common);
    assert.equal(first.created, true);
    const again = await prepareConfig(root, common);
    assert.equal(again.created, false);
    assert.deepEqual({ ...again, created: true }, first);
    assert.match(first.database, /^file:/);
    assert.ok(first.files.startsWith(root));
    assert.equal(new Set(Object.values(first.ports)).size, 6);
    const original = readFileSync(join(root, "floc/apps/web/.env"), "utf8");
    writeFileSync(join(root, "floc/apps/web/.env"), original + "\nPERSONAL_VALUE=preserved\n");
    await prepareConfig(root, common);
    assert.match(readFileSync(join(root, "floc/apps/web/.env"), "utf8"), /PERSONAL_VALUE=preserved/);
    const other = await prepareConfig(join(root, "other"), common);
    assert.notEqual(first.ports.web, other.ports.web);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(common, { recursive: true, force: true });
  }
});

test("a moved worktree's env file is pointed at its own database again, keeping everything else", async () => {
  const root = mkdtempSync(join(tmpdir(), "floc-moved-"));
  const common = mkdtempSync(join(tmpdir(), "floc-registry-"));
  try {
    mkdirSync(join(root, "floc/apps/web"), { recursive: true });
    writeFileSync(join(root, "floc/apps/web/.env"), "TURSO_DATABASE_URL=file:C:/old/place/.floc/data/local.db\nFLOC_FILES_DIR=C:/old/place/.floc/files\nGOOGLE_CLIENT_ID=kept\n");
    const config = await prepareConfig(root, common);
    const env = readFileSync(join(root, "floc/apps/web/.env"), "utf8");
    assert.match(env, new RegExp(`TURSO_DATABASE_URL=${config.database.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
    assert.doesNotMatch(env, /old\/place/);
    assert.match(env, /GOOGLE_CLIENT_ID=kept/);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(common, { recursive: true, force: true });
  }
});

test("the main checkout keeps its usual ports, database and env file", async () => {
  const root = mkdtempSync(join(tmpdir(), "floc-primary-"));
  const common = mkdtempSync(join(tmpdir(), "floc-registry-"));
  try {
    const config = await prepareConfig(root, common, { primary: true });
    assert.equal(config.ports.web, 3000);
    assert.equal(config.ports.metro, 8081);
    assert.equal(config.database, null);
    assert.equal(existsSync(join(root, "floc/apps/web/.env")), false);
    assert.equal(existsSync(join(common, "floc-workspaces.json")), false);
  } finally {
    rmSync(root, { recursive: true, force: true });
    rmSync(common, { recursive: true, force: true });
  }
});
