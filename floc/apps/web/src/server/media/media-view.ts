import "server-only";

import { groupMedia, MEDIA_LIMITS, mediaRatio, mediaShape, videoClock, type MediaGroup, type MediaKind, type MediaStop } from "@floc/core/media/media";

import type { TripAccess } from "@/server/access";
import { documentsEnabled } from "@/server/documents/document-store";
import { mediaRoom } from "./media-room";
import { listMedia } from "./media-rows";

export type MediaItem = {
  id: number;
  placeId: number | null;
  kind: MediaKind;
  ratio: number;
  shape: number;
  src: string;
  thumb: string;
  clock: string | null;
  who: string;
  tone?: string;
  mine: boolean;
};

export type MediaView = {
  groups: MediaGroup<MediaItem>[];
  total: number;
  capLine: string;
  canAdd: boolean;
};

export async function readMediaView(
  access: Pick<TripAccess, "trip" | "viewer" | "members">,
  stops: MediaStop[],
): Promise<MediaView> {
  const tripId = access.trip.id;
  const [rows, room] = await Promise.all([listMedia(tripId), mediaRoom(tripId, access.viewer.id)]);
  const people = new Map(access.members.map((m) => [m.userId, m]));
  const items: MediaItem[] = rows.map((row) => {
    const src = `/api/media/${tripId}/${row.id}`;
    const person = people.get(row.uploadedBy);
    return {
      id: row.id,
      placeId: row.placeId,
      kind: row.kind,
      ratio: mediaRatio(row.width, row.height),
      shape: mediaShape(row.width, row.height),
      src,
      thumb: row.kind === "photo" ? `${src}?size=thumb` : `${src}#t=0.1`,
      clock: row.kind === "video" ? videoClock(row.durationSeconds) : null,
      who: person?.name ?? "Former member",
      tone: person?.tone,
      mine: row.uploadedBy === access.viewer.id,
    };
  });
  const limit = (room.pro ? MEDIA_LIMITS.pro : MEDIA_LIMITS.free).photos;
  return {
    groups: groupMedia(items, stops),
    total: items.length,
    capLine: `${room.photos.toLocaleString("en-GB")} of ${limit.toLocaleString("en-GB")} photos`,
    canAdd: documentsEnabled() && !access.trip.archivedAt,
  };
}
