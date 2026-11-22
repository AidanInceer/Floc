import { toMinutes } from "../../dates/calendar";
import type { TransportType } from "../../vocabulary";

export type RouteDayPin = { overnightPlaceId: number | null; lat: number | null; lng: number | null; countryCode: string | null };
export type HopTimes = { time: string | null; endTime: string | null };

type RouteLeg = { placeId: number; placeName: string; days: { dayId: number }[]; nights: number; mode: TransportType | null };
type Spot = { lat: number; lng: number };

export type OverviewRoute = {
  stops: (Spot & { place: string; nights: number })[];
  moves: { mode: TransportType | null; time: string }[];
  countries: string[];
  uncoded: Spot[];
  missing: string[];
};

const NOT_SET = "Not set";

export function hopLength(time: string | null, endTime: string | null): string {
  const [a, b] = [toMinutes(time), toMinutes(endTime)];
  if (a === null || b === null || a === b) return "";
  return lengthLabel((b - a + 24 * 60) % (24 * 60));
}

export function lengthLabel(minutes: number): string {
  const [h, rest] = [Math.floor(minutes / 60), minutes % 60];
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
    route.stops.push({ place: leg.placeName, ...spot, nights: leg.nights });
    if (!pin.countryCode) route.uncoded.push(spot);
    else if (!route.countries.includes(pin.countryCode)) route.countries.push(pin.countryCode);
  }
  return route;
}
