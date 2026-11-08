import "server-only";

import { tripStorageBytes } from "@floc/core/documents/documents";

import { whoCanUse } from "@/server/billing/entitlements";
import { bytesByUploader } from "@/server/documents/documents";

export type StorageRoom = { usedBytes: number; quotaBytes: number; own: boolean };

/**
 * Whose room an upload fills (#285, #523). A Pro member has 1 GB of their own files on the trip;
 * everyone else shares the trip's 200 MB, which leaves Pro members' files out, so a Pro member
 * changes nothing for anyone else (ADR-012).
 */
export async function storageRoom(tripId: number, viewerId: string): Promise<StorageRoom> {
  const held = await bytesByUploader(tripId);
  const pro = await whoCanUse("files.extraStorage", [...new Set([viewerId, ...held.keys()])]);
  const own = pro.has(viewerId);

  let usedBytes = 0;
  for (const [uploader, bytes] of held) {
    if (own ? uploader === viewerId : !pro.has(uploader)) usedBytes += bytes;
  }
  return { usedBytes, quotaBytes: tripStorageBytes(own), own };
}

/** What the meter shows the viewer: their room, without saying whose. */
export async function storageUsage(tripId: number, viewerId: string): Promise<{ usedBytes: number; quotaBytes: number }> {
  const { usedBytes, quotaBytes } = await storageRoom(tripId, viewerId);
  return { usedBytes, quotaBytes };
}
