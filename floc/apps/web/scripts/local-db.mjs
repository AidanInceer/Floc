import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const web = join(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Why: a task worktree keeps its database in .floc/data and points .env at it.
 * Only a file: URL is followed, never TURSO_DATABASE_URL's remote form, so these
 * tools can never read or touch production (AGENTS.md, Real users).
 */
export function localDbFile(webDir, envText) {
  const url = envText.match(/^TURSO_DATABASE_URL=["']?([^"'\r\n]+)/m)?.[1];
  return url?.startsWith("file:") ? resolve(webDir, url.slice("file:".length)) : join(webDir, "local.db");
}

export async function openLocalDb() {
  const envFile = join(web, ".env");
  const file = localDbFile(web, existsSync(envFile) ? readFileSync(envFile, "utf8") : "");
  if (!existsSync(file)) {
    console.error(`No database at ${file}. Run pnpm --filter floc-web db:reset.`);
    process.exit(1);
  }
  const client = createClient({ url: `file:${file}` });
  // Why: query_only makes SQLite itself refuse writes, so no SQL parsing decides what is safe.
  await client.execute("PRAGMA query_only = ON");
  return client;
}
