import "server-only";

import { filesToTrim } from "@floc/core/documents/archive";
import { rejectForSpace, type DocCategory } from "@floc/core/documents/documents";

import type { TripAccess } from "@/server/access";
import { refresh } from "@/server/freshness";
import { LIMITS } from "@/server/limits";

import { documentsEnabled, dropDocument, hasDocument } from "../document-store";
import { countDocuments } from "../documents";
import { storageUsage } from "../storage-quota";
import { archivedRows, keysPastTheWeek, unarchiveDocument, type ArchivedRow } from "./archive-rows";

type Access = Pick<TripAccess, "trip" | "viewer">;

export type ArchivedFile = {
  id: number;
  name: string;
  mimeType: string;
  sizeBytes: number;
  category: DocCategory;
  uploadedBy: string;
  uploaderName: string;
  ownerId: string | null;
  archivedAt: Date;
};

const GONE = "That file is no longer in the archive.";

async function withBytes(rows: ArchivedRow[]): Promise<ArchivedRow[]> {
  const held = await Promise.all(rows.map((row) => hasDocument(row.storageKey)));
  return rows.filter((_, i) => held[i]);
}

export async function archivedFiles(access: Access, now = new Date()): Promise<ArchivedFile[]> {
  if (!documentsEnabled()) return [];
  const rows = await withBytes(await archivedRows(access.trip.id, now, { viewerId: access.viewer.id }));
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    category: row.category,
    uploadedBy: row.uploadedBy,
    uploaderName: row.displayName ?? row.userName,
    ownerId: row.ownerId,
    archivedAt: row.archivedAt,
  }));
}

export async function restoreDocument(access: Access, documentId: number, now = new Date()): Promise<string | null> {
  const tripId = access.trip.id;
  const [row] = await withBytes(await archivedRows(tripId, now, { viewerId: access.viewer.id, documentId }));
  if (!row) return GONE;

  const [held, space] = await Promise.all([countDocuments(tripId), storageUsage(tripId)]);
  if (held >= LIMITS.documents) return "This trip is holding as many files as it can";
  const noSpace = rejectForSpace(space.usedBytes, row.sizeBytes, space.quotaBytes);
  if (noSpace) return noSpace;

  await unarchiveDocument(row.id);
  refresh({ kind: "documents", tripId });
  return null;
}

export async function trimArchive(tripId: number, now = new Date()): Promise<void> {
  const [rows, space] = await Promise.all([archivedRows(tripId, now).then(withBytes), storageUsage(tripId)]);
  await Promise.all(filesToTrim(rows, space.quotaBytes).map((row) => dropDocument(row.storageKey)));
}

export async function purgeArchivedFiles(now = new Date()): Promise<number> {
  if (!documentsEnabled()) return 0;
  const keys = await keysPastTheWeek(now);
  await Promise.all(keys.map(dropDocument));
  return keys.length;
}
