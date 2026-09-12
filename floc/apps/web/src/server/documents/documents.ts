/**
 * The documents aggregate (ticket 239) — `document` rows, their soft-delete
 * (rule 8).
 *
 * One read serves both lists: shared rows and the viewer's own private rows
 * come back together, scoped in the query rather than filtered after, so
 * reading somebody else's private file is not expressible here (the shape
 * `server/packing.ts` uses for personal bags, ticket 220).
 */
import "server-only";

import { and, count, desc, eq, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { dayEvent, document, user, userProfile } from "@/db/schema";
import type { DocCategory } from "@floc/core/documents/documents";
import { bounded, LIMITS } from "@/server/limits";
import { touch } from "@/server/audit";

export type TripDocument = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  createdAt: Date;
  uploadedBy: string;
  uploaderName: string;
  /** Null = shared with the trip. Set = private, and only ever the viewer's. */
  ownerId: string | null;
  /** Where in the itinerary it sits — either, neither, or both null. */
  dayId: number | null;
  /** The *live* event, off the join — a soft-deleted one reads as unattached. */
  dayEventId: number | null;
  /** The event's own name, for the row's "on …" tag (ticket 323). */
  eventTitle: string | null;
  eventDayId: number | null;
};

/** Newest first — a documents list is a pile you add to, not a checklist. */
export async function listDocuments(
  tripId: number,
  viewerId: string,
): Promise<TripDocument[]> {
  const rows = await db
    .select({
      id: document.id,
      name: document.name,
      mimeType: document.mimeType,
      sizeBytes: document.sizeBytes,
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
    })
    .from(document)
    .innerJoin(user, eq(user.id, document.uploadedBy))
    // Rule 8 on the join's own condition, not the where: in the where it would
    // drop every unattached file too, rather than only the dead event's tag.
    .leftJoin(
      dayEvent,
      and(eq(dayEvent.id, document.dayEventId), isNull(dayEvent.deletedAt)),
    )
    .leftJoin(userProfile, eq(userProfile.userId, document.uploadedBy))
    .where(
      and(
        eq(document.tripId, tripId),
        isNull(document.deletedAt),
        or(isNull(document.ownerId), eq(document.ownerId, viewerId)),
      ),
    )
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
  }));
}

/**
 * The trip's files grouped by the event they sit on (tickets 322, 324). One
 * read, not one per block — the Days page needs every event's files at once.
 */
export function byEvent(docs: TripDocument[]): Map<number, TripDocument[]> {
  const out = new Map<number, TripDocument[]>();
  for (const doc of docs) {
    if (doc.dayEventId === null) continue;
    const run = out.get(doc.dayEventId);
    if (run) run.push(doc);
    else out.set(doc.dayEventId, [doc]);
  }
  return out;
}

/**
 * Park a document on a day or an event, or clear it (both null). Only touches
 * a live row; the resolver has already refused another trip's or somebody
 * else's private file.
 */
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

/**
 * How many live files this trip holds, shared and private together. The read
 * truncates at `LIMITS.documents`, so without a matching check on the write a
 * trip past the ceiling would lose older bookings off the page while the serve
 * route still handed them out — the one place a `LIMITS` ceiling is not
 * harmless (see `server/limits.ts`). It also bounds the disk.
 */
export async function countDocuments(tripId: number): Promise<number> {
  const row = await db
    .select({ n: count() })
    .from(document)
    .where(and(eq(document.tripId, tripId), isNull(document.deletedAt)))
    .get();
  return row?.n ?? 0;
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
}): Promise<void> {
  await db.insert(document).values(input).run();
}

export async function softDeleteDocument(documentId: number): Promise<void> {
  await db
    .update(document)
    .set({ deletedAt: new Date(), ...touch() })
    .where(and(eq(document.id, documentId), isNull(document.deletedAt)))
    .run();
}

/**
 * Re-file a document. Any member who can see the row may move it: filing is
 * housekeeping, not authorship, and the resolver has already refused anything
 * that is not this trip's or is somebody else's private file.
 */
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

/**
 * One live document by id, with no trip check (#325 feedback). Only for a
 * request carrying a valid view token: the token was minted for this exact id
 * *after* the ordinary check passed, so the permission has already been
 * decided and re-deciding it is not possible — the caller has no viewer.
 */
export async function liveDocument(
  documentId: number,
): Promise<typeof document.$inferSelect | undefined> {
  return db
    .select()
    .from(document)
    .where(and(eq(document.id, documentId), isNull(document.deletedAt)))
    .get();
}
