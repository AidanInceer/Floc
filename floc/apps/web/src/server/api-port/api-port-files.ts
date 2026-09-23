/**
 * The port's files half (#239, #296; split out of `api-port.ts`).
 *
 * SAME RULES AS THE WEB'S FORM, NOT A SECOND SET. Every refusal here comes out
 * of `@floc/core/documents` — the type list, the 8 MB cap, the name cleaner —
 * and the trip ceiling out of `LIMITS`. The phone gets the same "no" for the
 * same reason, in the same words.
 *
 * BYTES FIRST, ROW SECOND. An orphaned file on disk is invisible; a row
 * pointing at nothing is a broken link on the page. If the row fails the file
 * is dropped again rather than left behind.
 *
 * WITHOUT A VOLUME THIS DEGRADES (rule 11). `filesWritable` is false, the
 * client hides its upload, and a call that arrives anyway is told so in words.
 */
import "server-only";

import {
  allowedType,
  bytesMatchType,
  cleanFileName,
  MAX_DOCUMENT_BASE64_LENGTH,
  rejectForSpace,
  rejectUpload,
  renamedFileName,
  type DocCategory,
} from "@floc/core/documents/documents";
import type { FileUpload, FlocPort } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import {
  countDocuments,
  insertDocument,
  placeDocument,
  setDocumentCategory,
  setDocumentName,
  softDeleteDocument,
} from "@/server/documents/documents";
import {
  documentsEnabled,
  dropDocument,
  putDocument,
} from "@/server/documents/document-store";
import { mintViewToken } from "@/server/documents/view-link";
import { storageUsage } from "@/server/documents/storage-quota";
import { appUrl } from "@/lib/env";
import { refresh } from "@/server/freshness";
import { LIMITS } from "@/server/limits";

type FilesPort = Pick<
  FlocPort,
  | "uploadFile"
  | "deleteFile"
  | "setFileCategory"
  | "renameFile"
  | "fileUsage"
  | "attachFileToEvent"
  | "detachFileFromEvent"
  | "fileViewUrl"
  | "filesWritable"
>;

/** Base64 in, bytes out. A body that is not base64 is a broken client, not a user mistake. */
function decode(contentBase64: string): Uint8Array | null {
  try {
    return new Uint8Array(Buffer.from(contentBase64, "base64"));
  } catch {
    return null;
  }
}

export const filesPort: FilesPort = {
  filesWritable(): boolean {
    return documentsEnabled();
  },

  async uploadFile(
    viewerId: string,
    tripId: number,
    input: FileUpload,
  ): Promise<string | null> {
    const access = await scoped(viewerId, tripId);
    if (!documentsEnabled()) return "File storage is not set up";

    if (input.contentBase64.length > MAX_DOCUMENT_BASE64_LENGTH) return "Files are capped at 8 MB";

    const bytes = decode(input.contentBase64);
    if (!bytes || bytes.byteLength === 0) return "That file is empty";

    // The cap is checked on the decoded length, never on what the client said
    // the size was — the two are the same number only when nobody is lying.
    const refusal = rejectUpload(input.mimeType, bytes.byteLength);
    if (refusal) return refusal;
    const type = allowedType(input.mimeType);
    if (!type || !bytesMatchType(type.mimeType, bytes)) return "Only PDFs and images can go here";

    if ((await countDocuments(tripId)) >= LIMITS.documents) {
      return "This trip is holding as many files as it can";
    }
    const space = await storageUsage(tripId);
    const noSpace = rejectForSpace(space.usedBytes, bytes.byteLength, space.quotaBytes);
    if (noSpace) return noSpace;

    // Resolved, not trusted: the event id arrives from the client.
    const onEvent = input.dayEventId
      ? (await access.event(input.dayEventId)).id
      : null;

    const storageKey = await putDocument(bytes, type);
    try {
      await insertDocument({
        tripId,
        uploadedBy: access.viewer.id,
        // Anything but shared is private — a scope that failed to arrive lands
        // in your own pile, not the group's.
        ownerId: input.shared ? null : access.viewer.id,
        name: cleanFileName(input.name),
        storageKey,
        mimeType: type.mimeType,
        sizeBytes: bytes.byteLength,
        category: input.category,
        dayEventId: onEvent,
      });
    } catch (err) {
      await dropDocument(storageKey);
      throw err;
    }

    refresh({ kind: "documents", tripId });
    return null;
  },

  async deleteFile(viewerId: string, tripId: number, fileId: number) {
    const access = await scoped(viewerId, tripId);
    // The resolver binds the id to this trip, so another trip's file is not
    // addressable rather than merely refused (ticket 106).
    const doc = await access.document(fileId);

    await softDeleteDocument(doc.id);
    await dropDocument(doc.storageKey);
    refresh({ kind: "documents", tripId });
  },

  async attachFileToEvent(
    viewerId: string,
    tripId: number,
    fileId: number,
    dayEventId: number,
  ) {
    const access = await scoped(viewerId, tripId);
    // Both ids go through the resolvers, so another trip's is not expressible.
    const doc = await access.document(fileId);
    const event = await access.event(dayEventId);

    await placeDocument(doc.id, { dayId: null, dayEventId: event.id });
    refresh({ kind: "documents", tripId });
  },

  async detachFileFromEvent(viewerId: string, tripId: number, fileId: number) {
    const access = await scoped(viewerId, tripId);
    const doc = await access.document(fileId);

    await placeDocument(doc.id, { dayId: null, dayEventId: null });
    refresh({ kind: "documents", tripId });
  },

  async fileViewUrl(viewerId: string, tripId: number, fileId: number): Promise<string> {
    const access = await scoped(viewerId, tripId);
    // Resolved first: the token that comes out of this carries the permission,
    // so the check has to happen before it is minted, never after.
    const doc = await access.document(fileId);

    const token = mintViewToken(doc.id);
    return `${appUrl()}/trip/${tripId}/files/${doc.id}/raw?t=${token}`;
  },

  async fileUsage(viewerId, tripId) {
    await scoped(viewerId, tripId);
    return storageUsage(tripId);
  },

  async renameFile(viewerId, tripId, fileId, raw) {
    const access = await scoped(viewerId, tripId);
    const doc = await access.document(fileId);
    const name = renamedFileName(raw, doc.name);
    if (!name) return "Give the file a name.";
    await setDocumentName(doc.id, name);
    refresh({ kind: "documents", tripId });
    return null;
  },

  async setFileCategory(
    viewerId: string,
    tripId: number,
    fileId: number,
    category: DocCategory,
  ) {
    const access = await scoped(viewerId, tripId);
    const doc = await access.document(fileId);
    await setDocumentCategory(doc.id, category);
    refresh({ kind: "documents", tripId });
  },
};
