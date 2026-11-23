import "server-only";

import { and, asc, eq, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import { day, storedFile, tripMedia } from "@/db/schema";
import { fileColumns, linkTo, storageKeysOf, type FileFacts } from "@/server/documents/stored-file";
import { bounded, LIMITS } from "@/server/limits";

const shown = {
  id: tripMedia.id,
  placeId: tripMedia.placeId,
  uploadedBy: tripMedia.uploadedBy,
  kind: tripMedia.kind,
  mimeType: storedFile.mimeType,
  sizeBytes: storedFile.sizeBytes,
  width: tripMedia.width,
  height: tripMedia.height,
  durationSeconds: tripMedia.durationSeconds,
};

const live = (tripId: number) => and(eq(tripMedia.tripId, tripId), isNull(tripMedia.deletedAt));
const itsFile = eq(storedFile.id, tripMedia.storedFileId);

export async function listMedia(tripId: number) {
  const rows = await db.select(shown).from(tripMedia).innerJoin(storedFile, itsFile).where(live(tripId)).orderBy(asc(tripMedia.id)).limit(LIMITS.tripMedia).all();
  return bounded(rows, "tripMedia", `trip:${tripId}`);
}

export async function mediaHeld(tripId: number): Promise<{ total: number; photos: number; usedBytes: number }> {
  const row = await db
    .select({
      total: sql<number>`count(*)`,
      photos: sql<number>`coalesce(sum(${tripMedia.kind} = 'photo'), 0)`,
      usedBytes: sql<number>`coalesce(sum(${storedFile.sizeBytes}), 0)`,
    })
    .from(tripMedia)
    .innerJoin(storedFile, itsFile)
    .where(live(tripId))
    .get();
  return { total: row?.total ?? 0, photos: row?.photos ?? 0, usedBytes: row?.usedBytes ?? 0 };
}

export function liveMedia(tripId: number, mediaId: number) {
  return db
    .select({ id: tripMedia.id, uploadedBy: tripMedia.uploadedBy, kind: tripMedia.kind, ...fileColumns })
    .from(tripMedia)
    .innerJoin(storedFile, itsFile)
    .where(and(live(tripId), eq(tripMedia.id, mediaId)))
    .get();
}

export async function placeIsOnTrip(tripId: number, placeId: number): Promise<boolean> {
  const row = await db
    .select({ id: day.id })
    .from(day)
    .where(and(eq(day.tripId, tripId), eq(day.overnightPlaceId, placeId), isNull(day.deletedAt)))
    .limit(1)
    .get();
  return Boolean(row);
}

type NewMedia = Omit<typeof tripMedia.$inferInsert, "storedFileId"> & FileFacts;

export function insertMedia(values: NewMedia) {
  const { storageKey, mimeType, sizeBytes, ...shownOn } = values;
  return db.transaction(async (tx) => {
    const file = await linkTo({ storageKey, mimeType, sizeBytes }, tx);
    return tx.insert(tripMedia).values({ ...shownOn, ...file }).returning({ id: tripMedia.id }).get();
  });
}

export async function softDeleteMedia(mediaId: number): Promise<void> {
  const now = new Date();
  await db.update(tripMedia).set({ deletedAt: now, lastModifiedAt: now }).where(eq(tripMedia.id, mediaId));
}

export async function eraseMediaBy(userId: string, now: Date): Promise<string[]> {
  const rows = await db
    .update(tripMedia)
    .set({ deletedAt: now, lastModifiedAt: now })
    .where(and(eq(tripMedia.uploadedBy, userId), isNull(tripMedia.deletedAt)))
    .returning({ storedFileId: tripMedia.storedFileId })
    .all();
  return storageKeysOf(rows);
}
