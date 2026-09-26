/**
 * The bytes, on disk (ticket 239). Railway mounts a volume at
 * `FLOC_FILES_DIR`; no variable, no volume, and the whole Documents
 * feature hides rather than throwing (rule 11).
 *
 * Deliberately the only file in the codebase that touches the filesystem, and
 * it knows nothing about trips or members — `server/documents/documents.ts` owns who may
 * ask for a key, this owns what a key is worth.
 *
 * Known limit, stated in the ticket: one instance, one disk, no backups.
 * Cloudflare R2 is the upgrade, and it replaces this file and nothing else.
 */
import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AllowedType } from "@floc/core/documents/documents";

function root(): string | null {
  const dir = process.env.FLOC_FILES_DIR?.trim();
  return dir ? path.resolve(dir) : null;
}

/** False = no volume. The Overview block and Files page say so and offer no upload. */
export function documentsEnabled(): boolean {
  return root() !== null;
}

/**
 * Resolve a key to a path, refusing anything that escapes the root. The keys we
 * generate cannot contain a separator, so this only fires on a key that came
 * from somewhere it shouldn't have — which is exactly when it matters.
 */
function pathFor(dir: string, storageKey: string): string | null {
  const full = path.resolve(dir, storageKey);
  return full.startsWith(dir + path.sep) ? full : null;
}

export async function putDocument(
  bytes: Uint8Array,
  type: AllowedType,
): Promise<string> {
  const dir = root();
  if (!dir) throw new Error("File storage is not set up");
  const storageKey = `${randomUUID()}.${type.ext}`;
  const full = pathFor(dir, storageKey);
  if (!full) throw new Error("File storage is not set up");
  await mkdir(dir, { recursive: true });
  await writeFile(full, bytes);
  return storageKey;
}

/** Null when the volume is gone or the file is missing — the route 404s on it. */
export async function readDocument(
  storageKey: string,
): Promise<Buffer | null> {
  const dir = root();
  if (!dir) return null;
  const full = pathFor(dir, storageKey);
  if (!full) return null;
  try {
    return await readFile(full);
  } catch {
    return null;
  }
}

/**
 * Best-effort: the row is soft-deleted either way (rule 8), so a file left
 * behind by a disk error is orphaned, not reachable.
 */
export async function dropDocument(storageKey: string): Promise<void> {
  const dir = root();
  if (!dir) return;
  const full = pathFor(dir, storageKey);
  if (!full) return;
  await rm(full, { force: true }).catch(() => {});
}
