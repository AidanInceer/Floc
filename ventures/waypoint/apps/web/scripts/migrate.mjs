/**
 * Applies pending migrations, then exits. Railway runs this as the service's
 * pre-deploy command, so the database is never behind the code that is about
 * to take traffic — the failure mode that took /trips down when `trip.tags`
 * shipped without an ALTER (no such column: trip.tags).
 *
 * Deliberately NOT `drizzle-kit migrate`: drizzle-kit is a devDependency and a
 * production install may prune it. `drizzle-orm` and `@libsql/client` are both
 * runtime dependencies, and their migrator reads the same `drizzle/` folder
 * and the same `__drizzle_migrations` bookkeeping table, so the two are
 * interchangeable — `pnpm db:migrate` locally, this in the deploy.
 *
 * Paths resolve from this file, not the working directory: Railway runs the
 * command from the repo root, not from apps/web.
 *
 * Exits non-zero on failure, which fails the deploy and leaves the previous
 * version serving. That is the point — a half-migrated database behind new
 * code is the thing being prevented.
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsFolder = join(appDir, "drizzle");

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
  // Not an error worth failing a deploy over on its own — but it is never what
  // anyone means in production, so say so loudly rather than migrating a file
  // database that is about to vanish with the container.
  console.error(
    "[migrate] TURSO_DATABASE_URL is not set — refusing to migrate an ephemeral local file database.",
  );
  process.exit(1);
}

const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
const db = drizzle(client);

console.log(`[migrate] applying migrations from ${migrationsFolder}`);
await migrate(db, { migrationsFolder });
console.log("[migrate] up to date");

client.close();
