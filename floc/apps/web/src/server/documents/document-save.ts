import "server-only";

import {
  allowedType, bytesMatchType, cleanFileName, rejectForSpace, rejectUpload,
  renamedFileName, type DocCategory,
} from "@floc/core/documents/documents";

import type { TripAccess } from "@/server/access";
import { refresh } from "@/server/freshness";
import { LIMITS } from "@/server/limits";
import { documentsEnabled, dropDocument, putDocument } from "./document-store";
import {
  countDocuments, insertDocument, placeDocument, setDocumentCategory,
  setDocumentName, softDeleteDocument,
} from "./documents";
import { storageUsage } from "./storage-quota";

type Access = Pick<TripAccess, "trip" | "viewer" | "day" | "event" | "document">;
type Upload = {
  name: string;
  mimeType: string;
  bytes: Uint8Array;
  category: DocCategory;
  shared: boolean;
  dayId?: number | null;
  dayEventId?: number | null;
};

const changed = (access: Access) => refresh({ kind: "documents", tripId: access.trip.id });

export async function saveDocument(access: Access, input: Upload): Promise<string | null> {
  if (!documentsEnabled()) return "File storage is not set up";
  const refusal = rejectUpload(input.mimeType, input.bytes.byteLength);
  if (refusal) return refusal;
  const type = allowedType(input.mimeType);
  if (!type || !bytesMatchType(type.mimeType, input.bytes)) return "Only PDFs and images can go here";
  if ((await countDocuments(access.trip.id)) >= LIMITS.documents) {
    return "This trip is holding as many files as it can";
  }
  const space = await storageUsage(access.trip.id);
  const noSpace = rejectForSpace(space.usedBytes, input.bytes.byteLength, space.quotaBytes);
  if (noSpace) return noSpace;

  const dayEventId = input.dayEventId != null ? (await access.event(input.dayEventId)).id : null;
  const dayId = input.dayId != null && !dayEventId ? (await access.day(input.dayId)).id : null;
  const storageKey = await putDocument(input.bytes, type);
  try {
    await insertDocument({
      tripId: access.trip.id,
      uploadedBy: access.viewer.id,
      ownerId: input.shared ? null : access.viewer.id,
      name: cleanFileName(input.name),
      storageKey,
      mimeType: type.mimeType,
      sizeBytes: input.bytes.byteLength,
      category: input.category,
      dayId,
      dayEventId,
    });
  } catch (error) {
    await dropDocument(storageKey);
    throw error;
  }
  changed(access);
  return null;
}

export async function removeDocument(access: Access, documentId: number): Promise<void> {
  const doc = await access.document(documentId);
  await softDeleteDocument(doc.id);
  await dropDocument(doc.storageKey);
  changed(access);
}

export async function renameDocument(access: Access, documentId: number, rawName: string): Promise<string | null> {
  const doc = await access.document(documentId);
  const name = renamedFileName(rawName, doc.name);
  if (!name) return "Give the file a name.";
  await setDocumentName(doc.id, name);
  changed(access);
  return null;
}

export async function categoriseDocument(access: Access, documentId: number, category: DocCategory): Promise<void> {
  const doc = await access.document(documentId);
  await setDocumentCategory(doc.id, category);
  changed(access);
}

export async function fileDocumentOnEvent(access: Access, documentId: number, eventId: number | null): Promise<void> {
  const doc = await access.document(documentId);
  const event = eventId === null ? null : await access.event(eventId);
  await placeDocument(doc.id, { dayId: null, dayEventId: event?.id ?? null });
  changed(access);
}
