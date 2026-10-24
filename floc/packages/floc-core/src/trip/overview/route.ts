/**
 * The Overview's route as a map draws it: the legs that have a pin, in order, and how the group gets from each to the next.
 * Pure: the page hands in the legs, each day's pin and the times of each day's first transport event.
 */
import { toMinutes } from "../../dates/calendar";
import type { TransportType } from "../../vocabulary";

export type RouteDayPin = { overnightPlaceId: number | null; lat: number | null; lng: number | null; countryCode: string | null };
/** The start and end of a day's first transport event, `HH:MM`, each nullable. */
export type HopTimes = { time: string | null; endTime: string | null };

type RouteLeg = { placeId: number; placeName: string; days: { dayId: number }[]; mode: TransportType | null };
type Spot = { lat: number; lng: number };

export type OverviewRoute = {
  /** `nights` is the days the group sleeps there (rule 3). */
  stops: (Spot & { place: string; nights: number })[];
  /** `moves[k]` goes from `stops[k]` to `stops[k + 1]`. A leg with no transport event has no mode and says so. */
  moves: { mode: TransportType | null; time: string }[];
  /** ISO codes of the countries the stops stand in, first seen first. */
  countries: string[];
  /** Stops whose place has no country stored, for the map to look up from the land outline. */
  uncoded: Spot[];
  /** Legs with no pin, named so their absence is never silent (rule 11). */
  missing: string[];
};

const NOT_SET = "Not set";

/** How long a journey takes, as a tag writes it: "45 min", "3h", "2h 55", "4h 05". A journey that ends before it starts ends the next day. */
export function hopLength(time: string | null, endTime: string | null): string {
  const [a, b] = [toMinutes(time), toMinutes(endTime)];
  if (a === null || b === null || a === b) return "";
  const m = (b - a + 24 * 60) % (24 * 60);
  const [h, rest] = [Math.floor(m / 60), m % 60];
  if (!h) return `${rest} min`;
  return rest ? `${h}h ${String(rest).padStart(2, "0")}` : `${h}h`;
}

export function overviewRoute({
  legs,
  days,
  hops,
}: {
  legs: RouteLeg[];
  days: RouteDayPin[];
  hops: ReadonlyMap<number, HopTimes>;
}): OverviewRoute {
  const pins = new Map(days.map((d) => [d.overnightPlaceId, d]));
  const route: OverviewRoute = { stops: [], moves: [], countries: [], uncoded: [], missing: [] };
  for (const leg of legs) {
    const pin = pins.get(leg.placeId);
    if (!pin || pin.lat === null || pin.lng === null) {
      route.missing.push(leg.placeName);
      continue;
    }
    const spot = { lat: pin.lat, lng: pin.lng };
    if (route.stops.length) {
      const hop = leg.days[0] ? hops.get(leg.days[0].dayId) : undefined;
      route.moves.push(leg.mode ? { mode: leg.mode, time: hop ? hopLength(hop.time, hop.endTime) : "" } : { mode: null, time: NOT_SET });
    }
    route.stops.push({ place: leg.placeName, ...spot, nights: leg.days.length });
    if (!pin.countryCode) route.uncoded.push(spot);
    else if (!route.countries.includes(pin.countryCode)) route.countries.push(pin.countryCode);
  }
  return route;
}
