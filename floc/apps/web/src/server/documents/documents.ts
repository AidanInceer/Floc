import "server-only";

import { and, count, desc, eq, isNull, or, sum } from "drizzle-orm";

import { db } from "@/db";
import { dayEvent, document, storedFile, user, userProfile } from "@/db/schema";
import { fileColumns, linkTo } from "@/server/documents/stored-file";
import { parseBookingDetails, type BookingDetails } from "@floc/core/documents/booking/booking-details";
import type { DocCategory } from "@floc/core/documents/documents";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";

const visibleTo = (tripId: number, viewerId: string) => and(
  eq(document.tripId, tripId), isNull(document.deletedAt),
  or(isNull(document.ownerId), eq(document.ownerId, viewerId)),
);

export async function eventsWithDocuments(tripId: number, viewerId: string): Promise<Set<number>> {
  const rows = await db.selectDistinct({ eventId: dayEvent.id }).from(document)
    .innerJoin(dayEvent, and(eq(dayEvent.id, document.dayEventId), isNull(dayEvent.deletedAt)))
    .where(visibleTo(tripId, viewerId)).limit(LIMITS.documents).all();
  return new Set(rows.map((row) => row.eventId));
}

export type TripDocument = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  createdAt: Date;
  uploadedBy: string;
  uploaderName: string;
  ownerId: string | null;
  dayId: number | null;
  dayEventId: number | null;
  eventTitle: string | null;
  eventDayId: number | null;
  booking: BookingDetails | null;
};

export async function listDocuments(
  tripId: number,
  viewerId: string,
): Promise<TripDocument[]> {
  const rows = await db
    .select({
      id: document.id,
      name: document.name,
      mimeType: storedFile.mimeType,
      sizeBytes: storedFile.sizeBytes,
      category: document.category,
      createdAt: document.createdAt,
      uploadedBy: document.uploadedBy,
      userName: user.name,
      displayName: userProfile.displayName,
      ownerId: document.ownerId,
      dayId: document.dayId,
      dayEventId: dayEvent.id,
      eventTitle: dayEvent.title,
      eventDayId: dayEvent.dayId,
      bookingDetails: document.bookingDetails,
    })
    .from(document)
    .innerJoin(storedFile, eq(storedFile.id, document.storedFileId))
    .innerJoin(user, eq(user.id, document.uploadedBy))
    .leftJoin(
      dayEvent,
      and(eq(dayEvent.id, document.dayEventId), isNull(dayEvent.deletedAt)),
    )
    .leftJoin(userProfile, eq(userProfile.userId, document.uploadedBy))
    .where(visibleTo(tripId, viewerId))
    .orderBy(desc(document.createdAt), desc(document.id))
    .limit(LIMITS.documents)
    .all();

  return bounded(rows, "documents", `trip ${tripId}`).map((r) => ({
    id: r.id,
    name: r.name,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    category: r.category,
    createdAt: r.createdAt,
    uploadedBy: r.uploadedBy,
    uploaderName: r.displayName ?? r.userName,
    ownerId: r.ownerId,
    dayId: r.dayId,
    dayEventId: r.dayEventId,
    eventTitle: r.eventTitle,
    eventDayId: r.eventDayId,
    booking: parseBookingDetails(r.bookingDetails),
  }));
}

export async function placeDocument(
  documentId: number,
  where: { dayId: number | null; dayEventId: number | null },
): Promise<void> {
  await db
    .update(document)
    .set({ dayId: where.dayId, dayEventId: where.dayEventId, ...touch() })
    .where(and(eq(document.id, documentId), isNull(document.deletedAt)))
    .run();
}

export async function countDocuments(tripId: number): Promise<number> {
  const row = await db
    .select({ n: count() })
    .from(document)
    .where(and(eq(document.tripId, tripId), isNull(document.deletedAt)))
    .get();
  return row?.n ?? 0;
}

export async function usedBytes(tripId: number): Promise<number> {
  const row = await db
    .select({ bytes: sum(storedFile.sizeBytes).mapWith(Number) })
    .from(document)
    .innerJoin(storedFile, eq(storedFile.id, document.storedFileId))
    .where(and(eq(document.tripId, tripId), isNull(document.deletedAt)))
    .get();
  return row?.bytes ?? 0;
}

export async function insertDocument(input: {
  tripId: number;
  uploadedBy: string;
  ownerId: string | null;
  name: string;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  dayId?: number | null;
  dayEventId?: number | null;
  bookingDetails?: string | null;
}): Promise<void> {
  const { storageKey, mimeType, sizeBytes, ...placed } = input;
  await db.transaction(async (tx) => {
    const file = await linkTo({ storageKey, mimeType, sizeBytes }, tx);
    await tx.insert(document).values({ ...placed, ...file }).run();
  });
}

export async function softDeleteDocument(documentId: number): Promise<void> {
  await db
    .update(document)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(document.id, documentId), isNull(document.deletedAt)))
    .run();
}

export async function setDocumentName(documentId: number, name: string): Promise<void> {
  await db
    .update(document)
    .set({ name, ...touch() })
    .where(and(eq(document.id, documentId), isNull(document.deletedAt)))
    .run();
}

export async function setDocumentCategory(
  documentId: number,
  category: DocCategory,
): Promise<void> {
  await db
    .update(document)
    .set({ category, ...touch() })
    .where(and(eq(document.id, documentId), isNull(document.deletedAt)))
    .run();
}

export async function liveDocument(documentId: number) {
  return db
    .select({ id: document.id, tripId: document.tripId, ownerId: document.ownerId, name: document.name, ...fileColumns })
    .from(document)
    .innerJoin(storedFile, eq(storedFile.id, document.storedFileId))
    .where(and(eq(document.id, documentId), isNull(document.deletedAt)))
    .get();
}
