import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

import type { AllowedType } from "@floc/core/documents/documents";

function root(): string | null {
  const dir = process.env.FLOC_FILES_DIR?.trim();
  return dir ? path.resolve(dir) : null;
}

export function documentsEnabled(): boolean {
  return root() !== null;
}

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

export async function hasDocument(storageKey: string): Promise<boolean> {
  const dir = root();
  const full = dir ? pathFor(dir, storageKey) : null;
  if (!full) return false;
  return stat(full).then((found) => found.isFile(), () => false);
}

export async function dropDocument(storageKey: string): Promise<void> {
  const dir = root();
  if (!dir) return;
  const full = pathFor(dir, storageKey);
  if (!full) return;
  await rm(full, { force: true }).catch(() => {});
}
