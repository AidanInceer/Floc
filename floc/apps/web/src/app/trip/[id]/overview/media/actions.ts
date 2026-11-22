"use server";

import { requireTripAccess } from "@/server/access";
import { mintMediaToken } from "@/server/media/media-link";
import { removeMedia } from "@/server/media/media-save";

export async function mediaUploadToken(tripId: number): Promise<string> {
  const access = await requireTripAccess(tripId);
  return mintMediaToken("upload", access.viewer.id, access.trip.id);
}

export async function deleteMedia(tripId: number, mediaId: number): Promise<void> {
  await removeMedia(await requireTripAccess(tripId), mediaId);
}
