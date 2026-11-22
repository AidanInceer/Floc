import type { MediaKind } from "@floc/core/media/media";

export type TripMediaItem = {
  id: number;
  placeId: number | null;
  kind: MediaKind;
  mimeType: string;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  uploaderName: string;
  mine: boolean;
  url: string;
  thumbUrl: string;
};

export type TripMediaList = {
  items: TripMediaItem[];
  canAdd: boolean;
  uploadUrl: string;
  uploadToken: string;
};

export type MediaPort = {
  listTripMedia(viewerId: string, tripId: number): Promise<TripMediaList>;
  deleteTripMedia(viewerId: string, tripId: number, mediaId: number): Promise<void>;
};
