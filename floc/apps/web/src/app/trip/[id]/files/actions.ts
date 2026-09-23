"use server";

// Upload and removal for trip documents (ticket 239). The file is written to
// disk first and the row second: an orphaned file is invisible, whereas a row
// pointing at nothing is a broken link on the page.
import {
  allowedType,
  bytesMatchType,
  cleanFileName,
  parseDocCategory,
  rejectForSpace,
  rejectUpload,
  renamedFileName,
} from "@floc/core/documents/documents";
import { requireTripAccess } from "@/server/access";
import {
  countDocuments,
  insertDocument,
  placeDocument,
  setDocumentCategory,
  setDocumentName,
  softDeleteDocument,
} from "@/server/documents/documents";
import { LIMITS } from "@/server/limits";
import {
  documentsEnabled,
  dropDocument,
  putDocument,
} from "@/server/documents/document-store";
import { storageUsage } from "@/server/documents/storage-quota";
import { refresh } from "@/server/freshness";

/** Refusals come back as form errors, never throws (the validation convention). */
export async function uploadDocument(
  tripId: number,
  formData: FormData,
): Promise<{ error?: string } | void> {
  const access = await requireTripAccess(tripId);
  if (!documentsEnabled()) return { error: "File storage is not set up" };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Pick a file first" };
  }

  const refusal = rejectUpload(file.type, file.size);
  if (refusal) return { error: refusal };
  const type = allowedType(file.type);
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!type || !bytesMatchType(type.mimeType, bytes)) {
    return { error: "Only PDFs and images can go here" };
  }

  if ((await countDocuments(access.trip.id)) >= LIMITS.documents) {
    return { error: "This trip is holding as many files as it can" };
  }
  const space = await storageUsage(access.trip.id);
  const noSpace = rejectForSpace(space.usedBytes, file.size, space.quotaBytes);
  if (noSpace) return { error: noSpace };

  // Uploaded straight onto an event (ticket 322). Resolved, not trusted: the
  // id arrives as a hidden field.
  const onEvent = formData.get("dayEventId");
  const dayEventId = onEvent ? (await access.event(Number(onEvent))).id : null;

  const storageKey = await putDocument(bytes, type);

  try {
    await insertDocument({
      tripId: access.trip.id,
      uploadedBy: access.viewer.id,
      // Anything but "shared" is private — a scope that failed to arrive should
      // land in your own pile, not the group's.
      ownerId:
        formData.get("scope") === "shared" ? null : access.viewer.id,
      name: cleanFileName(file.name),
      storageKey,
      mimeType: type.mimeType,
      sizeBytes: file.size,
      category: parseDocCategory(formData.get("category")),
      dayEventId,
    });
  } catch (err) {
    await dropDocument(storageKey);
    throw err;
  }

  refresh({ kind: "documents", tripId: access.trip.id });
}

/**
 * Any member may remove a shared file, the way any member may drop a shared
 * packing line. A private file stays its owner's alone: the resolver never
 * hands one to anybody else, so it is not addressable here.
 */
export async function removeDocument(tripId: number, documentId: number) {
  const access = await requireTripAccess(tripId);
  const doc = await access.document(documentId);

  await softDeleteDocument(doc.id);
  await dropDocument(doc.storageKey);

  refresh({ kind: "documents", tripId: access.trip.id });
}

/**
 * Move a file to another heading. Any member who can see it may — the
 * resolver has already refused another trip's file and another member's
 * private one, and nothing is lost by re-filing.
 */
export async function setCategory(
  tripId: number,
  documentId: number,
  formData: FormData,
) {
  const access = await requireTripAccess(tripId);
  const doc = await access.document(documentId);

  await setDocumentCategory(doc.id, parseDocCategory(formData.get("category")));

  refresh({ kind: "documents", tripId: access.trip.id });
}

/** Same reach as re-filing: anyone who can see the file may give it a clearer name (#364). */
export async function renameDocument(
  tripId: number,
  documentId: number,
  rawName: string,
): Promise<{ error?: string }> {
  const access = await requireTripAccess(tripId);
  const doc = await access.document(documentId);
  const name = renamedFileName(rawName, doc.name);
  if (!name) return { error: "Give the file a name." };

  await setDocumentName(doc.id, name);

  refresh({ kind: "documents", tripId: access.trip.id });
  return {};
}

/**
 * Park an existing file on an event, or take it off again (ticket 322). Any
 * member who can see the row may: filing is housekeeping, like the category.
 * Both ids go through the resolvers, so another trip's is not expressible.
 */
export async function attachToEvent(
  tripId: number,
  dayEventId: number,
  formData: FormData,
) {
  const access = await requireTripAccess(tripId);
  const event = await access.event(dayEventId);
  const doc = await access.document(Number(formData.get("documentId")));

  await placeDocument(doc.id, { dayId: null, dayEventId: event.id });

  refresh({ kind: "documents", tripId: access.trip.id });
}

export async function detachFromEvent(tripId: number, documentId: number) {
  const access = await requireTripAccess(tripId);
  const doc = await access.document(documentId);

  await placeDocument(doc.id, { dayId: null, dayEventId: null });

  refresh({ kind: "documents", tripId: access.trip.id });
}
