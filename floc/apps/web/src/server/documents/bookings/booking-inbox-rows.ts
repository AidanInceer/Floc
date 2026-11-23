import "server-only";

import { and, asc, count, desc, eq, gt, gte, isNull, lte, or, sum } from "drizzle-orm";

import { today as todayIso, type IsoDate } from "@floc/core/dates/dates";
import { BOOKING_INBOX_FILES, bookingInboxCutoff, bookingInboxDeleteCutoff } from "@floc/core/documents/booking/booking-inbox";
import type { DatedTrip } from "@floc/core/documents/booking/booking-trip";
import type { DocCategory } from "@floc/core/documents/documents";

import { db } from "@/db";
import { bookingInbox, storedFile, trip, tripMembership } from "@/db/schema";
import { touch } from "@/server/audit";
import { fileColumns, linkTo } from "@/server/documents/stored-file";
import { LIMITS } from "@/server/limits";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const waiting = (userId: string, now: Date) =>
  and(eq(bookingInbox.userId, userId), isNull(bookingInbox.deletedAt), gt(bookingInbox.createdAt, bookingInboxCutoff(now)));

export async function waitingRows(userId: string, now: Date, id?: number) {
  return db
    .select({
      id: bookingInbox.id,
      name: bookingInbox.name,
      ...fileColumns,
      category: bookingInbox.category,
      bookingDetails: bookingInbox.bookingDetails,
      createdAt: bookingInbox.createdAt,
    })
    .from(bookingInbox)
    .innerJoin(storedFile, eq(storedFile.id, bookingInbox.storedFileId))
    .where(and(waiting(userId, now), id === undefined ? undefined : eq(bookingInbox.id, id)))
    .orderBy(desc(bookingInbox.createdAt), desc(bookingInbox.id))
    .limit(BOOKING_INBOX_FILES)
    .all();
}

export async function waitingUsage(userId: string, now: Date): Promise<{ files: number; bytes: number }> {
  const row = await db
    .select({ files: count(), bytes: sum(storedFile.sizeBytes).mapWith(Number) })
    .from(bookingInbox)
    .innerJoin(storedFile, eq(storedFile.id, bookingInbox.storedFileId))
    .where(waiting(userId, now))
    .get();
  return { files: row?.files ?? 0, bytes: row?.bytes ?? 0 };
}

export async function insertWaiting(input: {
  userId: string;
  name: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  bookingDetails: string | null;
}): Promise<number> {
  const { storageKey, mimeType, sizeBytes, ...waitingFile } = input;
  return db.transaction(async (tx) => {
    const file = await linkTo({ storageKey, mimeType, sizeBytes }, tx);
    const row = await tx.insert(bookingInbox).values({ ...waitingFile, ...file }).returning({ id: bookingInbox.id }).get();
    return row.id;
  });
}

export async function closeWaiting(userId: string, id: number, placed: boolean): Promise<boolean> {
  const at = new Date();
  const rows = await db
    .update(bookingInbox)
    .set({ deletedAt: at, placedAt: placed ? at : null, ...touch() })
    .where(and(eq(bookingInbox.id, id), eq(bookingInbox.userId, userId), isNull(bookingInbox.deletedAt)))
    .returning({ id: bookingInbox.id })
    .all();
  return rows.length === 1;
}

export async function reopenWaiting(userId: string, id: number): Promise<void> {
  await db
    .update(bookingInbox)
    .set({ deletedAt: null, placedAt: null, ...touch() })
    .where(and(eq(bookingInbox.id, id), eq(bookingInbox.userId, userId)))
    .run();
}

const PAGE = 500;
const MAX_PAGES = 40;

async function everyKey(where: ReturnType<typeof and>): Promise<string[]> {
  const keys: string[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const rows = await db
      .select({ storageKey: storedFile.storageKey })
      .from(bookingInbox)
      .innerJoin(storedFile, eq(storedFile.id, bookingInbox.storedFileId))
      .where(where)
      .orderBy(asc(bookingInbox.id))
      .limit(PAGE)
      .offset(page * PAGE)
      .all();
    keys.push(...rows.map((row) => row.storageKey));
    if (rows.length < PAGE) break;
  }
  return keys;
}

export async function keysPastTheMonth(now: Date): Promise<string[]> {
  const cutoff = bookingInboxDeleteCutoff(now);
  return everyKey(and(isNull(bookingInbox.placedAt), lte(bookingInbox.createdAt, cutoff), gt(bookingInbox.createdAt, new Date(cutoff.getTime() - WEEK_MS))));
}

export async function waitingKeysOwnedBy(userId: string, now: Date): Promise<string[]> {
  return everyKey(and(eq(bookingInbox.userId, userId), isNull(bookingInbox.placedAt), gt(bookingInbox.createdAt, bookingInboxDeleteCutoff(now))));
}

export async function tripsToPlaceIn(userId: string, today: IsoDate = todayIso()): Promise<(DatedTrip & { name: string })[]> {
  return db
    .select({ id: trip.id, name: trip.name, startDate: trip.startDate, endDate: trip.endDate })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(
      and(
        eq(tripMembership.userId, userId),
        isNull(tripMembership.deletedAt),
        isNull(trip.deletedAt),
        isNull(trip.archivedAt),
        or(isNull(trip.endDate), gte(trip.endDate, today)),
      ),
    )
    .orderBy(asc(trip.startDate), asc(trip.id))
    .limit(LIMITS.tripsPerUser)
    .all();
}
