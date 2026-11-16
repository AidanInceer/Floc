import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsFolder = join(appDir, "drizzle");

const url = process.env.TURSO_DATABASE_URL;
if (!url) {
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
