import { shortPlace, STOP_NOT_SET } from "@floc/core/itinerary/names/place-name";

export type StopLabel = { kind: "place" | "unset"; text: string } | { kind: "bed" };

const ROOM = 80;

export function stopLabel(placeName: string | null, width: number): StopLabel {
  if (!placeName) return { kind: "unset", text: width < ROOM ? "—" : STOP_NOT_SET };
  if (width < ROOM) return { kind: "bed" };
  return { kind: "place", text: shortPlace(placeName) };
}
