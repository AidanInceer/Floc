"use server";

import { parseDocCategory, rejectUpload } from "@floc/core/documents/documents";
import { requireTripAccess } from "@/server/access";
import { documentsEnabled } from "@/server/documents/document-store";
import {
  categoriseDocument, fileDocumentOnEvent, removeDocument as remove,
  renameDocument as rename, saveDocument,
} from "@/server/documents/document-save";

export async function uploadDocument(tripId: number, formData: FormData): Promise<{ error?: string } | void> {
  const access = await requireTripAccess(tripId);
  if (!documentsEnabled()) return { error: "File storage is not set up" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pick a file first" };
  const invalid = rejectUpload(file.type, file.size);
  if (invalid) return { error: invalid };
  const refusal = await saveDocument(access, {
    name: file.name,
    mimeType: file.type,
    bytes: new Uint8Array(await file.arrayBuffer()),
    category: parseDocCategory(formData.get("category")),
    shared: formData.get("scope") === "shared",
    dayId: formData.get("dayId") ? Number(formData.get("dayId")) : null,
    dayEventId: formData.get("dayEventId") ? Number(formData.get("dayEventId")) : null,
  });
  if (refusal) return { error: refusal };
}

export async function removeDocument(tripId: number, documentId: number) {
  await remove(await requireTripAccess(tripId), documentId);
}

export async function setCategory(tripId: number, documentId: number, formData: FormData) {
  await categoriseDocument(await requireTripAccess(tripId), documentId, parseDocCategory(formData.get("category")));
}

export async function renameDocument(tripId: number, documentId: number, rawName: string): Promise<{ error?: string }> {
  const refusal = await rename(await requireTripAccess(tripId), documentId, rawName);
  return refusal ? { error: refusal } : {};
}

export async function attachToEvent(tripId: number, dayEventId: number, formData: FormData) {
  await fileDocumentOnEvent(await requireTripAccess(tripId), Number(formData.get("documentId")), dayEventId);
}

export async function detachFromEvent(tripId: number, documentId: number) {
  await fileDocumentOnEvent(await requireTripAccess(tripId), documentId, null);
}
