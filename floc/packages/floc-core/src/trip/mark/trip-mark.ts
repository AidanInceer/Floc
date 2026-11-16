export const TRIP_MARK_LABELS = {
  wave: "Wave",
  mountain: "Mountain",
  skyline: "Skyline",
  forest: "Forest",
  house: "House",
  sun: "Sun",
  campfire: "Campfire",
  camper: "Camper van",
  island: "Island",
  lighthouse: "Lighthouse",
  lolly: "Ice lolly",
  sunglasses: "Sunglasses",
  flipflop: "Flip-flop",
  cocktail: "Cocktail",
  globe: "Globe",
} as const;

export type TripMark = keyof typeof TRIP_MARK_LABELS;

export const TRIP_MARKS = Object.keys(
  TRIP_MARK_LABELS,
) as readonly TripMark[] as readonly [TripMark, ...TripMark[]];

const RETIRED_MARKS: ReadonlySet<string> = new Set(["city", "tent", "umbrella", "sail", "cruise"]);

export function readTripMark(value: unknown): TripMark | null {
  if (typeof value !== "string") return null;
  if (value in TRIP_MARK_LABELS) return value as TripMark;
  return RETIRED_MARKS.has(value) ? "globe" : null;
}
