import "server-only";

import { filesToTrim } from "@floc/core/documents/archive";
import { rejectForSpace, tripStorageBytes, type DocCategory } from "@floc/core/documents/documents";

import type { TripAccess } from "@/server/access";
import { proStanding } from "@/server/billing/entitlements";
import { refresh } from "@/server/freshness";
import { LIMITS } from "@/server/limits";

import { documentsEnabled, dropDocument, hasDocument } from "../document-store";
import { countDocuments } from "../documents";
import { storageRoom } from "../storage-quota";
import { releaseBytes } from "../stored-file";
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

  const [held, room] = await Promise.all([countDocuments(tripId), storageRoom(tripId, row.uploadedBy)]);
  if (held >= LIMITS.documents) return "This trip is holding as many files as it can";
  const yours = room.own && row.uploadedBy === access.viewer.id;
  const noSpace = room.ended ? null : rejectForSpace(room.usedBytes, row.sizeBytes, room.quotaBytes, yours);
  if (noSpace) return noSpace;

  await unarchiveDocument(row.id);
  refresh({ kind: "documents", tripId });
  return null;
}

const SHARED_ROOM = "";

export async function trimArchive(tripId: number, now = new Date()): Promise<void> {
  const rows = await archivedRows(tripId, now).then(withBytes);
  const standing = await proStanding(rows.map((row) => row.uploadedBy));
  const rooms = new Map<string, ArchivedRow[]>();
  for (const row of rows) {
    const room = standing.has(row.uploadedBy) ? row.uploadedBy : SHARED_ROOM;
    rooms.set(room, [...(rooms.get(room) ?? []), row]);
  }
  const gone = [...rooms].flatMap(([room, files]) => filesToTrim(files, tripStorageBytes(standing.get(room) === "pro")));
  await releaseBytes(gone.map((row) => row.storageKey), dropDocument, now);
}

export async function purgeArchivedFiles(now = new Date()): Promise<number> {
  if (!documentsEnabled()) return 0;
  const keys = await keysPastTheWeek(now);
  await releaseBytes(keys, dropDocument, now);
  return keys.length;
}
