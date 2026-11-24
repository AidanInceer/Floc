import "server-only";

import { proStanding } from "@/server/billing/entitlements";

import { mediaByUploader } from "./media-rows";

export type MediaRoom = { pro: boolean; total: number; photos: number; usedBytes: number };

export async function mediaRoom(tripId: number, userId: string): Promise<MediaRoom> {
  const held = await mediaByUploader(tripId);
  const standing = await proStanding([userId, ...held.map((row) => row.uploadedBy)]);
  const mine = standing.get(userId);
  const counted = held.filter((row) => (mine ? row.uploadedBy === userId : !standing.has(row.uploadedBy)));
  return {
    pro: mine === "pro",
    total: held.reduce((sum, row) => sum + row.total, 0),
    photos: counted.reduce((sum, row) => sum + row.photos, 0),
    usedBytes: counted.reduce((sum, row) => sum + row.usedBytes, 0),
  };
}
