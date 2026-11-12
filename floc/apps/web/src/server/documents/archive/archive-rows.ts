/**
 * Why: `deleted_at` is the moment a file was archived. A row is in the archive for a week after it (ADR-048); the
 * row itself stays for good (rule 8), only its bytes go.
 */
import "server-only";

import { and, desc, eq, gt, isNotNull, isNull, lte, or } from "drizzle-orm";

import { FILE_ARCHIVE_DAYS, fileArchiveCutoff } from "@floc/core/documents/archive";

import { db } from "@/db";
import { document, user, userProfile } from "@/db/schema";
import { touch } from "@/server/audit";
import { LIMITS } from "@/server/limits";

const DAY_MS = 24 * 60 * 60 * 1000;

const inArchive = (now: Date) => and(isNotNull(document.deletedAt), gt(document.deletedAt, fileArchiveCutoff(now)));

type Scope = {
  /** Shared files and this member's own. Absent reads every member's, for the trip's totals only. */
  viewerId?: string;
  documentId?: number;
};

/** Newest first. Somebody else's private file is never in a viewer's result. */
export async function archivedRows(tripId: number, now: Date, { viewerId, documentId }: Scope = {}) {
  const rows = await db
    .select({
      id: document.id,
      name: document.name,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
      category: document.category,
      uploadedBy: document.uploadedBy,
      userName: user.name,
      displayName: userProfile.displayName,
      ownerId: document.ownerId,
      storageKey: document.storageKey,
      archivedAt: document.deletedAt,
    })
    .from(document)
    .innerJoin(user, eq(user.id, document.uploadedBy))
    .leftJoin(userProfile, eq(userProfile.userId, document.uploadedBy))
    .where(
      and(
        eq(document.tripId, tripId),
        inArchive(now),
        viewerId === undefined ? undefined : or(isNull(document.ownerId), eq(document.ownerId, viewerId)),
        documentId === undefined ? undefined : eq(document.id, documentId),
      ),
    )
    .orderBy(desc(document.deletedAt), desc(document.id))
    .limit(LIMITS.documents)
    .all();
  return rows.flatMap((row) => (row.archivedAt ? [{ ...row, archivedAt: row.archivedAt }] : []));
}

export type ArchivedRow = Awaited<ReturnType<typeof archivedRows>>[number];

export async function unarchiveDocument(documentId: number): Promise<void> {
  await db
    .update(document)
    .set({ deletedAt: null, ...touch() })
    .where(and(eq(document.id, documentId), isNotNull(document.deletedAt)))
    .run();
}

/**
 * Why a window and no "purged" mark: a mark needs a column. Deleting bytes that are already gone is harmless, so
 * each file past its week is swept on every run for one more week, which also covers a cron that was down.
 */
export async function keysPastTheWeek(now: Date): Promise<string[]> {
  const cutoff = fileArchiveCutoff(now);
  const rows = await db
    .select({ storageKey: document.storageKey })
    .from(document)
    .where(and(lte(document.deletedAt, cutoff), gt(document.deletedAt, new Date(cutoff.getTime() - FILE_ARCHIVE_DAYS * DAY_MS))))
    .orderBy(desc(document.deletedAt))
    .limit(LIMITS.documents)
    .all();
  return rows.map((row) => row.storageKey);
}

/** A member's own archived files on every trip, for erasing their account. */
export async function archivedKeysOwnedBy(userId: string, now: Date): Promise<string[]> {
  const rows = await db
    .select({ storageKey: document.storageKey })
    .from(document)
    .where(and(eq(document.ownerId, userId), inArchive(now)))
    .limit(LIMITS.documents)
    .all();
  return rows.map((row) => row.storageKey);
}
