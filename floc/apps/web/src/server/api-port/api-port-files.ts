import "server-only";

import { MAX_DOCUMENT_BASE64_LENGTH } from "@floc/core/documents/documents";
import type { FlocPort } from "@floc/api/port";

import { scoped } from "@/server/api-port/api-port-scope";
import {
  categoriseDocument, fileDocumentOnEvent, removeDocument,
  renameDocument, saveDocument,
} from "@/server/documents/document-save";
import { documentsEnabled } from "@/server/documents/document-store";
import { mintViewToken } from "@/server/documents/view-link";
import { storageUsage } from "@/server/documents/storage-quota";
import { appUrl } from "@/lib/env";

type FilesPort = Pick<FlocPort,
  | "uploadFile" | "deleteFile" | "setFileCategory" | "renameFile" | "fileUsage"
  | "attachFileToEvent" | "detachFileFromEvent" | "fileViewUrl" | "filesWritable"
>;

export const filesPort: FilesPort = {
  filesWritable: () => documentsEnabled(),

  async uploadFile(viewerId, tripId, input) {
    const access = await scoped(viewerId, tripId);
    if (!documentsEnabled()) return "File storage is not set up";
    if (input.contentBase64.length > MAX_DOCUMENT_BASE64_LENGTH) return "Files are capped at 8 MB";
    const bytes = new Uint8Array(Buffer.from(input.contentBase64, "base64"));
    if (bytes.byteLength === 0) return "That file is empty";
    return saveDocument(access, { ...input, bytes });
  },

  async deleteFile(viewerId, tripId, fileId) {
    await removeDocument(await scoped(viewerId, tripId), fileId);
  },

  async attachFileToEvent(viewerId, tripId, fileId, dayEventId) {
    await fileDocumentOnEvent(await scoped(viewerId, tripId), fileId, dayEventId);
  },

  async detachFileFromEvent(viewerId, tripId, fileId) {
    await fileDocumentOnEvent(await scoped(viewerId, tripId), fileId, null);
  },

  async fileViewUrl(viewerId, tripId, fileId) {
    const access = await scoped(viewerId, tripId);
    const doc = await access.document(fileId);
    const token = mintViewToken(doc.id);
    return `${appUrl()}/trip/${tripId}/files/${doc.id}/raw?t=${token}`;
  },

  async fileUsage(viewerId, tripId) {
    await scoped(viewerId, tripId);
    return storageUsage(tripId);
  },

  async renameFile(viewerId, tripId, fileId, raw) {
    return renameDocument(await scoped(viewerId, tripId), fileId, raw);
  },

  async setFileCategory(viewerId, tripId, fileId, category) {
    await categoriseDocument(await scoped(viewerId, tripId), fileId, category);
  },
};
