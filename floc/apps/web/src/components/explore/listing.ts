import { stopsOf, type ListingMove } from "@floc/core/trip/explore/listing-stops";
import type { PresetTrip, Region } from "@floc/core/trip/explore/preset-trips";

import type { RouteMapStop } from "@/components/map/route-map";

// Same families as the app's `region-tint.ts`, so a region is one colour on both.
const REGION_SKIN: Record<Region, string> = {
  Europe: "bg-pastel-blue text-pastel-blue-ink",
  Africa: "bg-pastel-yellow text-pastel-yellow-ink",
  Asia: "bg-pastel-red text-pastel-red-ink",
  Americas: "bg-pastel-green text-pastel-green-ink",
  Oceania: "bg-pen-soft text-pen-deep",
};

export function skinFor(trip: PresetTrip): string {
  return REGION_SKIN[trip.region];
}

// The region's colour for the land on an outline map. `--tone-*` is the pastel in light and its edge in dark, so the shape shows on both.
const REGION_LAND: Record<Region, string> = {
  Europe: "fill-[var(--tone-blue)] stroke-pastel-blue-ink/40",
  Africa: "fill-[var(--tone-yellow)] stroke-pastel-yellow-ink/40",
  Asia: "fill-[var(--tone-red)] stroke-pastel-red-ink/40",
  Americas: "fill-[var(--tone-green)] stroke-pastel-green-ink/40",
  Oceania: "fill-[var(--tone-blue)] stroke-pen-deep/40",
};

export function landFor(trip: PresetTrip): string {
  return REGION_LAND[trip.region];
}

const REGION_TONE: Record<Region, string> = { Europe: "blue", Africa: "yellow", Asia: "red", Americas: "green", Oceania: "blue" };

/** The region's colour as a token family (`--tone-red`), for a map drawn on a canvas. */
export function toneOf(trip: PresetTrip): string {
  return REGION_TONE[trip.region];
}

type Move = ListingMove;
type DayTrip = { mode: Move["mode"]; text: string };
type RoutePart =
  | { kind: "stay"; place: string; nights: number; dayTrips: DayTrip[] }
  | { kind: "move"; mode: Move["mode"]; text: string };

const moveLine = (move: Move) => `${move.place} · ${move.detail}`;

/** A listing as it is lived: each stay, the move between two stays, and the day trips made from a stay. */
export function routeParts(trip: PresetTrip): RoutePart[] {
  return stopsOf(trip).flatMap((stop): RoutePart[] => {
    const stay: RoutePart = {
      kind: "stay",
      place: stop.place,
      nights: stop.nights,
      dayTrips: stop.dayOuts.map((out) => ({ mode: out.mode, text: moveLine(out) })),
    };
    if (!stop.arrive) return [stay];
    // Why: "Hakone · 1h 30" then "Hakone" says the place twice; "High Atlas · 2h" then "Imlil" says the way.
    const text = stop.place.includes(stop.arrive.place) ? stop.arrive.detail : moveLine(stop.arrive);
    return [{ kind: "move", mode: stop.arrive.mode, text }, stay];
  });
}

export function routeStops(trip: PresetTrip): RouteMapStop[] {
  return stopsOf(trip).map((stop, i) => ({ no: i + 1, name: stop.place, days: stop.nights, lat: stop.lat, lng: stop.lng }));
}

export function firstBase(trip: PresetTrip): { lat: number; lng: number } {
  return stopsOf(trip)[0] ?? { lat: 0, lng: 0 };
}
