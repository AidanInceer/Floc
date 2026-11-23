import "server-only";

import { and, eq, exists, gt, inArray, isNull, or } from "drizzle-orm";

import { bookingInboxDeleteCutoff } from "@floc/core/documents/booking/booking-inbox";

import { db } from "@/db";
import { bookingInbox, document, storedFile, tripMedia } from "@/db/schema";

export type FileFacts = { storageKey: string; mimeType: string; sizeBytes: number };

export const fileColumns = {
  storageKey: storedFile.storageKey,
  mimeType: storedFile.mimeType,
  sizeBytes: storedFile.sizeBytes,
};

export async function linkTo(file: FileFacts, on: Pick<typeof db, "insert"> = db) {
  const row = await on
    .insert(storedFile)
    .values(file)
    .onConflictDoUpdate({ target: storedFile.storageKey, set: { lastModifiedAt: new Date() } })
    .returning({ id: storedFile.id })
    .get();
  return {
    storedFileId: row.id,
    retiredStorageKey: file.storageKey,
    retiredMimeType: file.mimeType,
    retiredSizeBytes: file.sizeBytes,
  };
}

export async function storageKeysOf(links: { storedFileId: number | null }[]): Promise<string[]> {
  const ids = links.flatMap((link) => (link.storedFileId === null ? [] : [link.storedFileId]));
  if (ids.length === 0) return [];
  const files = await db.select({ storageKey: storedFile.storageKey }).from(storedFile).where(inArray(storedFile.id, ids)).all();
  return files.map((file) => file.storageKey);
}

const CHUNK = 500;

async function stillNeeded(keys: string[], now: Date): Promise<string[]> {
  const rows = await db
    .select({ key: storedFile.storageKey })
    .from(storedFile)
    .where(
      and(
        inArray(storedFile.storageKey, keys),
        or(
          exists(
            db.select({ id: document.id }).from(document)
              .where(and(eq(document.storedFileId, storedFile.id), isNull(document.deletedAt))),
          ),
          exists(
            db.select({ id: tripMedia.id }).from(tripMedia)
              .where(and(eq(tripMedia.storedFileId, storedFile.id), isNull(tripMedia.deletedAt))),
          ),
          exists(
            db.select({ id: bookingInbox.id }).from(bookingInbox)
              .where(
                and(
                  eq(bookingInbox.storedFileId, storedFile.id),
                  isNull(bookingInbox.deletedAt),
                  isNull(bookingInbox.placedAt),
                  gt(bookingInbox.createdAt, bookingInboxDeleteCutoff(now)),
                ),
              ),
          ),
        ),
      ),
    )
    .all();
  return rows.map((row) => row.key);
}

export async function releaseBytes(
  keys: string[],
  drop: (storageKey: string) => Promise<void>,
  now = new Date(),
): Promise<void> {
  for (let start = 0; start < keys.length; start += CHUNK) {
    const chunk = keys.slice(start, start + CHUNK);
    const kept = new Set(await stillNeeded(chunk, now));
    const free = chunk.filter((key) => !kept.has(key));
    if (free.length === 0) continue;
    await Promise.all(free.map(drop));
    await db
      .update(storedFile)
      .set({ bytesDeletedAt: now, lastModifiedAt: now })
      .where(and(inArray(storedFile.storageKey, free), isNull(storedFile.bytesDeletedAt)));
  }
}
