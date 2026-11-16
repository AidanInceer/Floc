import { createClient } from "@libsql/client";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const web = join(dirname(fileURLToPath(import.meta.url)), "..");

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
  await client.execute("PRAGMA query_only = ON");
  return client;
}
