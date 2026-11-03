import { createClient } from "@libsql/client";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Why: local.db only, never TURSO_DATABASE_URL, so these tools can never read or touch production (AGENTS.md, Real users).
const file = join(dirname(fileURLToPath(import.meta.url)), "..", "local.db");

export async function openLocalDb() {
  if (!existsSync(file)) {
    console.error(`No database at ${file}. Run pnpm --filter floc-web db:reset.`);
    process.exit(1);
  }
  const client = createClient({ url: `file:${file}` });
  // Why: query_only makes SQLite itself refuse writes, so no SQL parsing decides what is safe.
  await client.execute("PRAGMA query_only = ON");
  return client;
}
