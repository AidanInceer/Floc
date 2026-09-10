"use server";

// Upload and removal for trip documents (ticket 239). The file is written to
// disk first and the row second: an orphaned file is invisible, whereas a row
// pointing at nothing is a broken link on the page.
import {
  allowedType,
  cleanFileName,
  parseDocCategory,
  rejectUpload,
} from "@floc/core/documents/documents";
import { requireTripAccess } from "@/server/access";
import {
  countDocuments,
  insertDocument,
  setDocumentCategory,
  softDeleteDocument,
} from "@/server/documents/documents";
import { LIMITS } from "@/server/limits";
import {
  documentsEnabled,
  dropDocument,
  putDocument,
} from "@/server/documents/document-store";
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
  if (!type) return { error: "Only PDFs and images can go here" };

  if ((await countDocuments(access.trip.id)) >= LIMITS.documents) {
    return { error: "This trip is holding as many files as it can" };
  }

  const storageKey = await putDocument(
    new Uint8Array(await file.arrayBuffer()),
    type,
  );

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
    });
  } catch (err) {
    await dropDocument(storageKey);
    throw err;
  }

  refresh({ kind: "documents", tripId: access.trip.id });
}

/**
 * Uploader only — deliberately stricter than packing, where any member may drop
 * a shared line. A booking someone else is relying on is not yours to bin.
 */
export async function removeDocument(tripId: number, documentId: number) {
  const access = await requireTripAccess(tripId);
  const doc = await access.document(documentId);
  if (doc.uploadedBy !== access.viewer.id) {
    throw new Error("Only whoever uploaded it can remove it");
  }

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
