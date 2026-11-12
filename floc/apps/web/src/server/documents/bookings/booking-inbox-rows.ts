/**
 * The SQL of a member's Bookings area (#559). Every read and write names the member, so somebody else's
 * waiting file is not expressible here.
 */
import "server-only";

import { and, asc, count, desc, eq, gt, isNull, lte, sum } from "drizzle-orm";

import { BOOKING_INBOX_FILES, bookingInboxCutoff, bookingInboxDeleteCutoff } from "@floc/core/documents/booking/booking-inbox";
import type { DatedTrip } from "@floc/core/documents/booking/booking-trip";
import type { DocCategory } from "@floc/core/documents/documents";

import { db } from "@/db";
import { bookingInbox, trip, tripMembership } from "@/db/schema";
import { touch } from "@/server/audit";
import { LIMITS } from "@/server/limits";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

const waiting = (userId: string, now: Date) =>
  and(eq(bookingInbox.userId, userId), isNull(bookingInbox.deletedAt), gt(bookingInbox.createdAt, bookingInboxCutoff(now)));

export async function waitingRows(userId: string, now: Date, id?: number) {
  return db
    .select({
      id: bookingInbox.id,
      name: bookingInbox.name,
      storageKey: bookingInbox.storageKey,
      mimeType: bookingInbox.mimeType,
      sizeBytes: bookingInbox.sizeBytes,
      category: bookingInbox.category,
      bookingDetails: bookingInbox.bookingDetails,
      createdAt: bookingInbox.createdAt,
    })
    .from(bookingInbox)
    .where(and(waiting(userId, now), id === undefined ? undefined : eq(bookingInbox.id, id)))
    .orderBy(desc(bookingInbox.createdAt), desc(bookingInbox.id))
    .limit(BOOKING_INBOX_FILES)
    .all();
}

/** What the list holds against its space: only files still on it. */
export async function waitingUsage(userId: string, now: Date): Promise<{ files: number; bytes: number }> {
  const row = await db
    .select({ files: count(), bytes: sum(bookingInbox.sizeBytes).mapWith(Number) })
    .from(bookingInbox)
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
  const row = await db.insert(bookingInbox).values(input).returning({ id: bookingInbox.id }).get();
  return row.id;
}

/**
 * Takes a file off the list, and says whether this call was the one that did. `placed` keeps the bytes, which
 * now belong to a trip's file. Why the answer matters: placing and removing at once must not both win, or the
 * sweep would delete the bytes of a file that is on a trip.
 */
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

/** Puts a file back on the list, when the trip file it was claimed for could not be saved. */
export async function reopenWaiting(userId: string, id: number): Promise<void> {
  await db
    .update(bookingInbox)
    .set({ deletedAt: null, placedAt: null, ...touch() })
    .where(and(eq(bookingInbox.id, id), eq(bookingInbox.userId, userId)))
    .run();
}

const PAGE = 500;
const MAX_PAGES = 40;

/** Every key a query gives, a page at a time in id order, so none past the first page is missed. */
async function everyKey(where: ReturnType<typeof and>): Promise<string[]> {
  const keys: string[] = [];
  for (let page = 0; page < MAX_PAGES; page += 1) {
    const rows = await db
      .select({ storageKey: bookingInbox.storageKey })
      .from(bookingInbox)
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

/**
 * Why a window and no "purged" mark: deleting bytes that are already gone is harmless, so each unplaced file
 * past its month is swept on every run for one more week, which also covers a cron that was down (as ADR-048).
 */
export async function keysPastTheMonth(now: Date): Promise<string[]> {
  const cutoff = bookingInboxDeleteCutoff(now);
  return everyKey(and(isNull(bookingInbox.placedAt), lte(bookingInbox.createdAt, cutoff), gt(bookingInbox.createdAt, new Date(cutoff.getTime() - WEEK_MS))));
}

/** A member's unplaced files that may still have bytes, for erasing their account. */
export async function waitingKeysOwnedBy(userId: string, now: Date): Promise<string[]> {
  return everyKey(and(eq(bookingInbox.userId, userId), isNull(bookingInbox.placedAt), gt(bookingInbox.createdAt, bookingInboxDeleteCutoff(now))));
}

/** The trips a member is on now and has not archived: the only trips a booking of theirs can go to. */
export async function tripsToPlaceIn(userId: string): Promise<(DatedTrip & { name: string })[]> {
  return db
    .select({ id: trip.id, name: trip.name, startDate: trip.startDate, endDate: trip.endDate })
    .from(tripMembership)
    .innerJoin(trip, eq(trip.id, tripMembership.tripId))
    .where(and(eq(tripMembership.userId, userId), isNull(tripMembership.deletedAt), isNull(trip.deletedAt), isNull(trip.archivedAt)))
    .orderBy(desc(trip.startDate), desc(trip.id))
    .limit(LIMITS.tripsPerUser)
    .all();
}
