/**
 * Back to nothing (#no-ticket), so `db:reset` lands on the same database every
 * time rather than the seed plus whatever the last test left behind.
 *
 * ROWS, NOT THE FILE. Deleting `local.db` would be simpler, but `next dev`
 * holds it open and Windows refuses to delete an open file. Emptying every
 * table works with the servers still running, and keeps the schema and the
 * migration journal exactly as they were.
 *
 * `sqlite_sequence` goes too, so trip ids restart at 1 and a URL from
 * yesterday's notes still points at the same trip. `fx_rate` stays: it is a
 * cache of somebody else's API, not state anyone tests against.
 *
 * LOCAL ONLY. It refuses anything but a `file:` database and anything in
 * production — this empties every account, and the one place that must never
 * happen is the one a mistyped `.env` could point it at.
 */
import { rm } from "node:fs/promises";
import { isAbsolute, relative, resolve } from "node:path";

import { sql } from "drizzle-orm";

import { db } from "../index.ts";
import { assertLocalDatabase } from "./local-only.ts";

const KEEP = new Set(["__drizzle_migrations", "fx_rate", "sqlite_sequence"]);

async function emptyTables(): Promise<number> {
  const tables = await db.all<{ name: string }>(
    sql`select name from sqlite_master where type = 'table' and name not like 'sqlite_%'`,
  );
  const doomed = tables.map((t) => t.name).filter((name) => !KEEP.has(name));

  // Off for the sweep: table order would otherwise have to follow every
  // foreign key, and a new table would break this until someone reordered it.
  await db.run(sql`pragma foreign_keys = off`);
  try {
    for (const name of doomed) await db.run(sql.raw(`delete from "${name}"`));
    await db.run(sql`delete from sqlite_sequence`);
  } finally {
    await db.run(sql`pragma foreign_keys = on`);
  }
  return doomed.length;
}

/** Uploaded bytes whose `document` rows just went. Only ever inside this app's folder. */
async function emptyUploads(): Promise<string | null> {
  const dir = process.env.FLOC_FILES_DIR?.trim();
  if (!dir) return null;

  const target = resolve(dir);
  const inside = relative(process.cwd(), target);
  if (!inside || inside.startsWith("..") || isAbsolute(inside)) {
    throw new Error(`Refusing to clear FLOC_FILES_DIR outside the web app: ${target}`);
  }

  await rm(target, { recursive: true, force: true });
  return inside;
}

export async function wipeEverything(): Promise<string> {
  assertLocalDatabase();
  const tables = await emptyTables();
  const uploads = await emptyUploads();
  return `Wiped ${tables} tables${uploads ? ` and ${uploads}` : ""}.`;
}
