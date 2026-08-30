/**
 * Marks `0000_baseline` as already applied on a database that predates the
 * migrations folder — the production database, which had every table in it
 * before drizzle knew anything about migrations. It records the hash drizzle
 * would have recorded and runs **none** of the migration's SQL, so a migrator
 * run afterwards is a no-op instead of a pile of "table already exists".
 *
 * Only ever valid for the baseline. A later migration contains real changes
 * and must actually run — stamping one here would silently skip it.
 *
 * Already run once against production (2026-07-30). Kept for the next
 * environment created from an existing database.
 *
 *   railway run --service floc-web node floc/apps/web/scripts/baseline-migrations.mjs
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@libsql/client";
import { readMigrationFiles } from "drizzle-orm/migrator";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrations = readMigrationFiles({
  migrationsFolder: join(appDir, "drizzle"),
});
console.log(
  "migrations on disk:",
  migrations.map((m) => `${m.folderMillis} ${m.hash.slice(0, 12)}…`).join(", "),
);

const c = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

await c.execute(
  "CREATE TABLE IF NOT EXISTS `__drizzle_migrations` (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at numeric)",
);

const existing = await c.execute("SELECT hash FROM `__drizzle_migrations`");
const have = new Set(existing.rows.map((r) => r.hash));
console.log("already recorded:", have.size);

// Baseline only: every table in 0000 exists already. A later migration must
// NOT be stamped this way — it has to actually run.
const baseline = migrations[0];
if (have.has(baseline.hash)) {
  console.log("baseline already recorded — nothing to do");
} else {
  await c.execute({
    sql: "INSERT INTO `__drizzle_migrations` (hash, created_at) VALUES (?, ?)",
    args: [baseline.hash, baseline.folderMillis],
  });
  console.log("baseline recorded:", baseline.hash.slice(0, 12) + "…");
}

const after = await c.execute("SELECT hash, created_at FROM `__drizzle_migrations`");
console.log("rows now:", after.rows.length);
