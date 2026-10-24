/**
 * Stop derivation (ticket 15 / 04): a "stop" is never stored, only a run of
 * consecutive `day` rows sharing `overnightPlaceId`. Pure, no DB access.
 * Two visits to the same place split by a different (or null) overnight are
 * TWO stops — contiguity is by day order, not place identity.
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
  /** Nights spent at this stop: one per day, except the trip's last day. */
  nights: number;
  dayIds: number[];
};

/**
 * The stops that are actually somewhere (ticket 137). `deriveStops` includes
 * runs with no overnight place too, since positions must line up with the day
 * rows underneath a reorder — but the Route tab lists only placed ones: a
 * numbered "No overnight place set" node turned one added stop into two.
 */
export function placedStops(stops: Stop[]): Stop[] {
  return stops.filter((s) => s.placeId !== null);
}

export function nightsLabel(nights: number): string {
  if (nights === 0) return "Day home";
  return nights === 1 ? "1 night" : `${nights} nights`;
}

// Callers must pass days pre-sorted by date ascending; this does not sort.
export function deriveStops(days: StopDayInput[]): Stop[] {
  const stops: Stop[] = [];

  for (const d of days) {
    const last = stops[stops.length - 1];
    if (last && last.placeId === d.overnightPlaceId) {
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

  for (const s of stops) s.nights = s.dayIds.length;
  // Why: the trip's last day is the day home, so its bed is no night — the same count as nightsBetween on Dates.
  const last = stops[stops.length - 1];
  if (last) last.nights -= 1;

  return stops;
}
