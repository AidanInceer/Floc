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
