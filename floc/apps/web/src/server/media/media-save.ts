import "server-only";

import { Refusal } from "@floc/core/errors/refusal";
import { bytesMatchMedia, maxBytesFor, mediaType, refuseType, rejectMedia, type MediaType } from "@floc/core/media/media";

import type { TripAccess } from "@/server/access";
import { accountRefusal } from "@/server/documents/storage-quota";
import { documentsEnabled } from "@/server/documents/document-store";
import { refresh } from "@/server/freshness";
import { LIMITS } from "@/server/limits";
import { releaseBytes } from "@/server/documents/stored-file";

import { mediaRoom } from "./media-room";
import { insertMedia, liveMedia, placeIsOnTrip, softDeleteMedia } from "./media-rows";
import {
  dropFile, dropMediaFiles, keepAs, mediaPath, newMediaKey, receiveUpload,
  thumbKeyOf, TooLarge, type Received,
} from "./media-store";

type Access = Pick<TripAccess, "trip" | "viewer">;

const LONG_EDGE = 2048;
const THUMB_EDGE = 640;
const MAX_INPUT_PIXELS = 120_000_000;

type CleanPhoto = { width: number; height: number; sizeBytes: number };

async function cleanPhoto(input: string, output: string, thumb: string): Promise<CleanPhoto> {
  const { default: sharp } = await import("sharp");
  const source = () => sharp(input, { failOn: "error", limitInputPixels: MAX_INPUT_PIXELS }).rotate();
  const info = await source()
    .resize(LONG_EDGE, LONG_EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 84 })
    .toFile(output);
  await source()
    .resize(THUMB_EDGE, THUMB_EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 74 })
    .toFile(thumb);
  return { width: info.width, height: info.height, sizeBytes: info.size };
}

export type MediaUpload = {
  body: ReadableStream<Uint8Array>;
  mimeType: string;
  declaredBytes: number | null;
  placeId: number | null;
  width?: number | null;
  height?: number | null;
  durationSeconds?: number | null;
};

type Saved = { id?: number; error?: string };

const changed = (tripId: number) => refresh({ kind: "tripOverview", tripId });
const wholeNumber = (value: number | null | undefined) =>
  value != null && Number.isInteger(value) && value > 0 && value < 1_000_000 ? value : null;

async function storeFile(received: Received, type: MediaType, input: MediaUpload) {
  if (type.kind === "video") {
    const storageKey = newMediaKey(type.ext);
    await keepAs(received.file, storageKey);
    return {
      storageKey,
      mimeType: type.mimeType,
      sizeBytes: received.sizeBytes,
      width: wholeNumber(input.width),
      height: wholeNumber(input.height),
      durationSeconds: wholeNumber(input.durationSeconds),
    };
  }
  const storageKey = newMediaKey("webp");
  const output = mediaPath(storageKey)!;
  const thumb = mediaPath(thumbKeyOf(storageKey))!;
  try {
    const clean = await cleanPhoto(received.file, output, thumb);
    return { storageKey, mimeType: "image/webp", durationSeconds: null, ...clean };
  } catch (error) {
    await dropMediaFiles(storageKey);
    throw error;
  } finally {
    await dropFile(received.file);
  }
}

const NOT_MEDIA = "That file is not a photo or video Floc can take.";

type Cleared = { type: MediaType; maxBytes: number; refuse: (sizeBytes: number) => string | null };

async function clearUpload(access: Access, input: MediaUpload): Promise<Cleared | { error: string }> {
  if (!documentsEnabled()) return { error: "File storage is not set up" };
  const tripId = access.trip.id;
  if (access.trip.archivedAt) return { error: "This trip is archived." };
  const type = mediaType(input.mimeType);
  if (!type) return { error: refuseType(input.mimeType) };
  if (input.placeId !== null && !(await placeIsOnTrip(tripId, input.placeId))) {
    return { error: "That stop is not on this trip." };
  }
  const [room, account] = await Promise.all([mediaRoom(tripId, access.viewer.id), accountRefusal(access.viewer.id)]);
  if (room.total >= LIMITS.tripMedia) return { error: "This trip is holding as many pictures as it can." };
  const { pro } = room;
  const refuse = (sizeBytes: number) =>
    rejectMedia({ pro, kind: type.kind, sizeBytes, photosHeld: room.photos, usedBytes: room.usedBytes }) ?? account(sizeBytes);
  const early = refuse(input.declaredBytes ?? 0);
  return early ? { error: early } : { type, refuse, maxBytes: maxBytesFor(pro, type.kind) };
}

async function receiveChecked(input: MediaUpload, cleared: Cleared): Promise<Received | { error: string }> {
  let received: Received;
  try {
    received = await receiveUpload(input.body, cleared.maxBytes);
  } catch (error) {
    if (error instanceof TooLarge) return { error: cleared.refuse(cleared.maxBytes + 1) ?? "That file is too large." };
    throw error;
  }
  const late = cleared.refuse(received.sizeBytes);
  if (!late && received.sizeBytes > 0 && bytesMatchMedia(cleared.type.mimeType, received.head)) return received;
  await dropFile(received.file);
  return { error: late ?? NOT_MEDIA };
}

export async function saveMedia(access: Access, input: MediaUpload): Promise<Saved> {
  const tripId = access.trip.id;
  const cleared = await clearUpload(access, input);
  if ("error" in cleared) return cleared;
  const received = await receiveChecked(input, cleared);
  if ("error" in received) return received;
  const { type } = cleared;

  let file: Awaited<ReturnType<typeof storeFile>>;
  try {
    file = await storeFile(received, type, input);
  } catch {
    await dropFile(received.file);
    return { error: NOT_MEDIA };
  }
  try {
    const row = await insertMedia({ tripId, placeId: input.placeId, uploadedBy: access.viewer.id, kind: type.kind, ...file });
    changed(tripId);
    return { id: row.id };
  } catch (error) {
    await dropMediaFiles(file.storageKey);
    throw error;
  }
}

export async function removeMedia(access: Access, mediaId: number): Promise<void> {
  const row = await liveMedia(access.trip.id, mediaId);
  if (!row) throw new Refusal("That picture has gone.", "missing");
  if (access.trip.archivedAt) throw new Refusal("This trip is archived.");
  if (row.uploadedBy !== access.viewer.id) throw new Refusal("Only the person who added it can delete it.");
  await softDeleteMedia(row.id);
  await releaseBytes([row.storageKey], dropMediaFiles);
  changed(access.trip.id);
}
