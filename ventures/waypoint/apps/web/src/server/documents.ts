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
import { document, user, userProfile } from "@/db/schema";
import type { DocCategory } from "@/lib/documents";
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
    })
    .from(document)
    .innerJoin(user, eq(user.id, document.uploadedBy))
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
  }));
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
