import "server-only";

import { rejectForAccount, rejectForSpace, tripStorageBytes } from "@floc/core/documents/documents";

import { canUseFeature, proStanding } from "@/server/billing/entitlements";
import { accountBytes, bytesByUploader } from "@/server/documents/documents";

export type StorageRoom = { usedBytes: number; quotaBytes: number; own: boolean; ended: boolean };

export async function storageRoom(tripId: number, userId: string): Promise<StorageRoom> {
  const held = await bytesByUploader(tripId);
  const standing = await proStanding([userId, ...held.keys()]);
  const mine = standing.get(userId);
  const own = mine !== undefined;

  let usedBytes = 0;
  for (const [uploader, bytes] of held) {
    if (own ? uploader === userId : !standing.has(uploader)) usedBytes += bytes;
  }
  return { usedBytes, quotaBytes: tripStorageBytes(mine === "pro"), own, ended: mine === "ended" };
}

export async function storageUsage(tripId: number, viewerId: string): Promise<{ usedBytes: number; quotaBytes: number }> {
  const { usedBytes, quotaBytes } = await storageRoom(tripId, viewerId);
  return { usedBytes, quotaBytes };
}

export async function accountRefusal(userId: string): Promise<(incomingBytes: number) => string | null> {
  if (await canUseFeature("files.extraStorage", userId)) return () => null;
  const used = await accountBytes(userId);
  return (incomingBytes) => rejectForAccount(used, incomingBytes);
}

export async function refuseNewFile(tripId: number, userId: string, incomingBytes: number): Promise<string | null> {
  const [room, account] = await Promise.all([storageRoom(tripId, userId), accountRefusal(userId)]);
  return rejectForSpace(room.usedBytes, incomingBytes, room.quotaBytes, room.own) ?? account(incomingBytes);
}
