/**
 * A member's Bookings area (#559, ADR-050): files that wait for them to choose a trip.
 *
 * Why its own store of rows: a trip's file must have a trip, and these have none yet. Placing one hands its
 * bytes to an ordinary private file on the trip, so nothing here ever shows a file to anyone but its member.
 */
import "server-only";

import {
  BOOKING_INBOX_BYTES, BOOKING_INBOX_FILES, bookingInboxDaysLeft,
} from "@floc/core/documents/booking/booking-inbox";
import { parseBookingDetails, storeBookingDetails, type BookingDetails } from "@floc/core/documents/booking/booking-details";
import {
  allowedType, bytesMatchType, cleanFileName, rejectForSpace, rejectUpload, type DocCategory,
} from "@floc/core/documents/documents";

import { findTripAccess } from "@/server/access";
import { refresh } from "@/server/freshness";
import { LIMITS } from "@/server/limits";

import { documentsEnabled, dropDocument, hasDocument, putDocument } from "../document-store";
import { countDocuments, insertDocument } from "../documents";
import { storageUsage } from "../storage-quota";
import {
  closeWaiting, insertWaiting, keysPastTheMonth, reopenWaiting, tripsToPlaceIn, waitingRows, waitingUsage,
} from "./booking-inbox-rows";

export type WaitingBooking = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  details: BookingDetails | null;
  arrivedAt: Date;
  daysLeft: number;
};

const GONE = "That file is no longer waiting.";

export async function waitingBookings(userId: string, now = new Date()): Promise<WaitingBooking[]> {
  if (!documentsEnabled()) return [];
  const rows = await waitingRows(userId, now);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    category: row.category,
    details: parseBookingDetails(row.bookingDetails),
    arrivedAt: row.createdAt,
    daysLeft: bookingInboxDaysLeft(row.createdAt, now),
  }));
}

export async function waitingCount(userId: string, now = new Date()): Promise<number> {
  if (!documentsEnabled()) return 0;
  return (await waitingUsage(userId, now)).files;
}

export async function bookingInboxUsage(userId: string, now = new Date()): Promise<{ usedBytes: number; quotaBytes: number }> {
  return { usedBytes: (await waitingUsage(userId, now)).bytes, quotaBytes: BOOKING_INBOX_BYTES };
}

type Incoming = {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  category?: DocCategory;
  details?: BookingDetails | null;
};

/** Null when it is waiting, else the refusal in the words a form shows. */
export async function saveWaitingBooking(userId: string, input: Incoming, now = new Date()): Promise<string | null> {
  if (!documentsEnabled()) return "File storage is not set up";
  const refusal = rejectUpload(input.mimeType, input.bytes.byteLength);
  if (refusal) return refusal;
  const type = allowedType(input.mimeType);
  if (!type || !bytesMatchType(type.mimeType, input.bytes)) return "Only PDFs and images can go here";

  const held = await waitingUsage(userId, now);
  if (held.files >= BOOKING_INBOX_FILES) return "Your bookings list is full. Choose a trip for some of them first.";
  const noSpace = rejectForSpace(held.bytes, input.bytes.byteLength, BOOKING_INBOX_BYTES);
  if (noSpace) return noSpace;

  const storageKey = await putDocument(input.bytes, type);
  try {
    await insertWaiting({
      userId,
      name: cleanFileName(input.name),
      storageKey,
      mimeType: type.mimeType,
      sizeBytes: input.bytes.byteLength,
      category: input.category ?? "other",
      bookingDetails: storeBookingDetails(input.details ?? null),
    });
  } catch (error) {
    await dropDocument(storageKey);
    throw error;
  }
  refresh({ kind: "bookings" });
  return null;
}

/** Moves a waiting file to the member's private files on one of their trips. Null when it moved. */
export async function placeWaitingBooking(userId: string, id: number, tripId: number, now = new Date()): Promise<string | null> {
  const [row] = await waitingRows(userId, now, id);
  if (!row || !(await hasDocument(row.storageKey))) return GONE;
  // Why: rule 5. A trip that is not theirs, one that does not exist and one that is over or archived answer alike.
  const [access, open] = await Promise.all([findTripAccess(tripId, userId), tripsToPlaceIn(userId)]);
  if (!access || !open.some((trip) => trip.id === tripId)) return "Choose one of your trips.";

  const [held, space] = await Promise.all([countDocuments(tripId), storageUsage(tripId)]);
  if (held >= LIMITS.documents) return "This trip is holding as many files as it can";
  const noSpace = rejectForSpace(space.usedBytes, row.sizeBytes, space.quotaBytes);
  if (noSpace) return noSpace;

  // Why the claim comes first: only one of two calls at once may take the file, so its bytes get one owner.
  if (!(await closeWaiting(userId, row.id, true))) return GONE;
  try {
    await insertDocument({
      tripId,
      uploadedBy: userId,
      ownerId: userId,
      name: row.name,
      storageKey: row.storageKey,
      mimeType: row.mimeType,
      sizeBytes: row.sizeBytes,
      category: row.category,
      bookingDetails: row.bookingDetails,
    });
  } catch (error) {
    await reopenWaiting(userId, row.id);
    throw error;
  }
  refresh({ kind: "documents", tripId });
  refresh({ kind: "bookings" });
  return null;
}

/**
 * Off the list, and its bytes off the disk, at once. Why no wait: a waiting file has no archive to restore
 * from, and bytes kept after Remove would sit outside the list's space (ADR-050).
 */
export async function removeWaitingBooking(userId: string, id: number, now = new Date()): Promise<void> {
  const [row] = await waitingRows(userId, now, id);
  if (!row || !(await closeWaiting(userId, row.id, false))) return;
  await dropDocument(row.storageKey);
  refresh({ kind: "bookings" });
}

export async function tripsForPlacing(userId: string) {
  return tripsToPlaceIn(userId);
}

/** The cron's sweep: the bytes of every unplaced file whose month is up. Returns how many it swept. */
export async function purgeWaitingBookings(now = new Date()): Promise<number> {
  if (!documentsEnabled()) return 0;
  const keys = await keysPastTheMonth(now);
  await Promise.all(keys.map(dropDocument));
  return keys.length;
}
