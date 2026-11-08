/**
 * A span of days as one overnight place (ticket 141): what the stop strip
 * opens the overnight dialog on. A "stay" is derived from the days, never
 * stored (rule 3).
 */
export type BandSpan = {
  start: string;
  end: string;
  placeId: number | null;
  placeName: string | null;
};
