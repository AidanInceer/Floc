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
/**
 * The stops that are actually somewhere (ticket 137).
 *
 * `deriveStops` groups every run of days, including the runs with no overnight
 * place, because the runs are what a reorder permutes and their positions have
 * to line up with the day rows underneath. What the Route tab *lists* is not
 * the same thing: a run of undecided days is an absence of a stop, and drawing
 * it as a numbered node called "No overnight place set" made adding one stop to
 * a ten-day trip produce two — one you asked for and one you didn't, which then
 * had a "Remove stop" button on a stop that doesn't exist. The undecided days
 * are still on Days, where they read as days without a bed rather than as an
 * extra leg of the journey.
 */
export function placedStops(stops: Stop[]): Stop[] {
  return stops.filter((s) => s.placeId !== null);
}

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
