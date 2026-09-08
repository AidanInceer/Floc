/**
 * The port's files half (tickets 239, 296; split out of `api-port.ts`).
 *
 * SAME RULES AS THE WEB'S FORM, NOT A SECOND SET. Every refusal here comes out
 * of `@floc/core/documents` — the type list, the 10 MB cap, the name cleaner —
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
  cleanFileName,
  rejectUpload,
  type DocCategory,
} from "@floc/core/documents";
import type { FileUpload, FlocPort } from "@floc/api/port";

import { scoped } from "@/server/api-port-scope";
import {
  countDocuments,
  insertDocument,
  setDocumentCategory,
  softDeleteDocument,
} from "@/server/documents";
import {
  documentsEnabled,
  dropDocument,
  putDocument,
} from "@/server/document-store";
import { refresh } from "@/server/freshness";
import { LIMITS } from "@/server/limits";

type FilesPort = Pick<
  FlocPort,
  "uploadFile" | "deleteFile" | "setFileCategory" | "filesWritable"
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

    const bytes = decode(input.contentBase64);
    if (!bytes || bytes.byteLength === 0) return "That file is empty";

    // The cap is checked on the decoded length, never on what the client said
    // the size was — the two are the same number only when nobody is lying.
    const refusal = rejectUpload(input.mimeType, bytes.byteLength);
    if (refusal) return refusal;
    const type = allowedType(input.mimeType);
    if (!type) return "Only PDFs and images can go here";

    if ((await countDocuments(tripId)) >= LIMITS.documents) {
      return "This trip is holding as many files as it can";
    }

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
    if (doc.uploadedBy !== access.viewer.id) {
      throw new Error("Only whoever uploaded it can remove it.");
    }

    await softDeleteDocument(doc.id);
    await dropDocument(doc.storageKey);
    refresh({ kind: "documents", tripId });
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
