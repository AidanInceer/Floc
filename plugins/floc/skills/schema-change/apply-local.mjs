// Why: db:generate writes a migration but applies nothing, and local.db is not
// tracked by drizzle's journal, so the new SQL is run by hand. Hardwired to
// floc/apps/web/local.db so it can never reach a shared database.
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { basename, join, resolve } from "node:path";

const web = resolve(import.meta.dirname, "../../../../floc/apps/web");
const database = join(web, "local.db");
const file = process.argv[2];

if (!file || !existsSync(file)) {
  console.error("usage: node apply-local.mjs <path to drizzle/NNNN_name.sql>");
  process.exit(2);
}
if (!existsSync(database)) {
  console.error(`no local database at ${database} — run db:reset first`);
  process.exit(2);
}

const { createClient } = createRequire(join(web, "package.json"))("@libsql/client");
const client = createClient({ url: `file:${database}` });
const statements = readFileSync(file, "utf8")
  .split("--> statement-breakpoint")
  .map((s) => s.trim())
  .filter(Boolean);

let applied = 0;
for (const sql of statements) {
  try {
    await client.execute(sql);
    applied++;
  } catch (error) {
    if (/already exists|duplicate column/i.test(String(error))) {
      console.log(`skipped (already applied): ${sql.split("\n")[0]}`);
      continue;
    }
    throw error;
  }
}
console.log(`${basename(file)}: ${applied} of ${statements.length} statements applied to local.db`);
