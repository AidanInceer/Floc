import { rm } from "node:fs/promises";
import { relative, resolve } from "node:path";

import { sql } from "drizzle-orm";

import { db } from "../index.ts";
import { assertClearableFilesDir, assertLocalDatabase } from "./local-only.ts";

const KEEP = new Set(["__drizzle_migrations", "fx_rate", "sqlite_sequence"]);

async function emptyTables(): Promise<number> {
  const tables = await db.all<{ name: string }>(
    sql`select name from sqlite_master where type = 'table' and name not like 'sqlite_%'`,
  );
  const doomed = tables.map((t) => t.name).filter((name) => !KEEP.has(name));

  await db.run(sql`pragma foreign_keys = off`);
  try {
    for (const name of doomed) await db.run(sql.raw(`delete from "${name}"`));
    await db.run(sql`delete from sqlite_sequence`);
  } finally {
    await db.run(sql`pragma foreign_keys = on`);
  }
  return doomed.length;
}

async function emptyUploads(): Promise<string | null> {
  const dir = process.env.FLOC_FILES_DIR?.trim();
  if (!dir) return null;

  const target = resolve(dir);
  assertClearableFilesDir(target, process.cwd());
  await rm(target, { recursive: true, force: true });
  return relative(process.cwd(), target);
}

export async function wipeEverything(): Promise<string> {
  assertLocalDatabase();
  const tables = await emptyTables();
  const uploads = await emptyUploads();
  return `Wiped ${tables} tables${uploads ? ` and ${uploads}` : ""}.`;
}
