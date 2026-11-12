import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { localDbFile } from "./local-db.mjs";

const web = join("C:", "dev", "Floc", "floc", "apps", "web");

void test("a task worktree reads the database its .env points at", () => {
  const env = 'GOOGLE_CLIENT_ID=x\nTURSO_DATABASE_URL="file:C:/dev/Floc/.claude/worktrees/a/.floc/data/local.db"\n';
  assert.equal(localDbFile(web, env), join("C:/dev/Floc/.claude/worktrees/a/.floc/data/local.db"));
});

void test("the main checkout's relative file URL resolves beside the web app", () => {
  assert.equal(localDbFile(web, "TURSO_DATABASE_URL=file:./local.db"), join(web, "local.db"));
});

void test("a remote database URL is never used, so these tools cannot reach production", () => {
  assert.equal(localDbFile(web, "TURSO_DATABASE_URL=libsql://floc.turso.io"), join(web, "local.db"));
  assert.equal(localDbFile(web, ""), join(web, "local.db"));
});
