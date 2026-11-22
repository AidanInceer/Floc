import "server-only";

import type { MediaPort } from "@floc/api/port/media";

import { scoped } from "@/server/api-port/api-port-scope";
import { documentsEnabled } from "@/server/documents/document-store";
import { mintMediaToken } from "@/server/media/media-link";
import { listMedia } from "@/server/media/media-rows";
import { removeMedia } from "@/server/media/media-save";

export const mediaPort: MediaPort = {
  async listTripMedia(viewerId, tripId) {
    const access = await scoped(viewerId, tripId);
    const rows = await listMedia(tripId);
    const names = new Map(access.members.map((m) => [m.userId, m.name]));
    const view = mintMediaToken("view", viewerId, tripId);
    const base = `/api/media/${tripId}`;
    return {
      items: rows.map((row) => ({
        id: row.id,
        placeId: row.placeId,
        kind: row.kind,
        mimeType: row.mimeType,
        width: row.width,
        height: row.height,
        durationSeconds: row.durationSeconds,
        uploaderName: names.get(row.uploadedBy) ?? "Former member",
        mine: row.uploadedBy === viewerId,
        url: `${base}/${row.id}?t=${view}`,
        thumbUrl: `${base}/${row.id}?size=thumb&t=${view}`,
      })),
      canAdd: documentsEnabled() && !access.trip.archivedAt,
      uploadUrl: base,
      uploadToken: mintMediaToken("upload", viewerId, tripId),
    };
  },

  async deleteTripMedia(viewerId, tripId, mediaId) {
    await removeMedia(await scoped(viewerId, tripId), mediaId);
  },
};
