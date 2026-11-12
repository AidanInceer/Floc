import { test } from "node:test";
import assert from "node:assert/strict";
import { join, resolve } from "node:path";
import { localDbFile } from "./local-db.mjs";

const web = resolve("/floc/apps/web");

void test("a task worktree reads the database its .env points at", () => {
  const db = resolve("/worktrees/a/.floc/data/local.db");
  const env = `GOOGLE_CLIENT_ID=x\nTURSO_DATABASE_URL="file:${db.replaceAll("\\", "/")}"\n`;
  assert.equal(localDbFile(web, env), db);
});

void test("the main checkout's relative file URL resolves beside the web app", () => {
  assert.equal(localDbFile(web, "TURSO_DATABASE_URL=file:./local.db"), join(web, "local.db"));
});

void test("a remote database URL is never used, so these tools cannot reach production", () => {
  assert.equal(localDbFile(web, "TURSO_DATABASE_URL=libsql://floc.turso.io"), join(web, "local.db"));
  assert.equal(localDbFile(web, ""), join(web, "local.db"));
});
