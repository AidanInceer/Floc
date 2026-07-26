/**
 * Stop derivation (ticket 15 / ticket 04): a "stop" is never stored. It is a
 * run of consecutive `day` rows that share the same `overnightPlaceId`. This
 * module is pure — no DB access — so it's trivially unit-testable and callers
 * (Route page, Days page) just feed it ordered day rows.
 *
 * Two visits to the same place separated by a different overnight place (or a
 * null gap) are TWO stops, not one — contiguity is by day order, not by place
 * identity.
 */

export type StopDayInput = {
  dayId: number;
  date: string; // YYYY-MM-DD
  overnightPlaceId: number | null;
  overnightPlaceName: string | null;
};

export type Stop = {
  /** null for a run of days with no overnight place set yet. */
  placeId: number | null;
  placeName: string | null;
  startDate: string;
  endDate: string;
  /** Nights spent at this stop — one less than day count for a single day. */
  nights: number;
  dayIds: number[];
};

/**
 * Groups ordered days into stops. Callers must pass days already sorted by
 * date ascending — this function does not sort, so callers own that decision
 * (and can pass a pre-filtered/sub-range slice if needed).
 */
export function deriveStops(days: StopDayInput[]): Stop[] {
  const stops: Stop[] = [];

  for (const d of days) {
    const last = stops[stops.length - 1];
    if (last && last.placeId === d.overnightPlaceId) {
      // Same overnight place as the immediately preceding day → extend.
      last.endDate = d.date;
      last.dayIds.push(d.dayId);
      continue;
    }
    stops.push({
      placeId: d.overnightPlaceId,
      placeName: d.overnightPlaceName,
      startDate: d.date,
      endDate: d.date,
      nights: 0,
      dayIds: [d.dayId],
    });
  }

  for (const s of stops) {
    // A stop of N consecutive days = N-1 nights there, plus a final night
    // departing (the last day's overnight is still "at" that place).
    s.nights = s.dayIds.length;
  }

  return stops;
}
