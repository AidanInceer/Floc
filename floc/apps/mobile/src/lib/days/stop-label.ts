export type StopLabel = { kind: "place" | "unset"; text: string } | { kind: "bed" };

const ROOM = 80;

export function stopLabel(placeName: string | null, width: number): StopLabel {
  if (!placeName) return { kind: "unset", text: width < ROOM ? "—" : "Not set" };
  if (width < ROOM) return { kind: "bed" };
  return { kind: "place", text: placeName.split(",")[0] };
}
