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

function legLine(leg: PresetTrip["legs"][number]): string {
  if (leg.kind === "hop") return `${leg.place} · ${leg.detail}`;
  return `${leg.place} · ${leg.nights} ${leg.nights === 1 ? "night" : "nights"}`;
}

type Hop = Extract<PresetTrip["legs"][number], { kind: "hop" }>;
type DayTrip = { mode: Hop["mode"]; text: string };
type RoutePart =
  | { kind: "stay"; place: string; nights: number; dayTrips: DayTrip[] }
  | { kind: "move"; mode: Hop["mode"]; text: string };

/** A listing as it is lived: each stay, the move between two stays, and the day trips made from a stay. */
export function routeParts(trip: PresetTrip): RoutePart[] {
  const parts: RoutePart[] = [];
  let stay: Extract<RoutePart, { kind: "stay" }> | undefined;
  trip.legs.forEach((leg, i) => {
    const next = trip.legs[i + 1];
    if (leg.kind === "base") {
      stay = { kind: "stay", place: leg.place, nights: leg.nights, dayTrips: [] };
      parts.push(stay);
    } else if (next?.kind === "base") {
      // Why: "Hakone · 1h 30" then "Hakone" says the place twice; "High Atlas · 2h" then "Imlil" says the way.
      parts.push({ kind: "move", mode: leg.mode, text: next.place.includes(leg.place) ? leg.detail : legLine(leg) });
    } else {
      stay?.dayTrips.push({ mode: leg.mode, text: legLine(leg) });
    }
  });
  return parts;
}

export function routeStops(trip: PresetTrip): RouteMapStop[] {
  return trip.legs.flatMap((l) => (l.kind === "base" ? [l] : [])).map((b, i) => ({
    no: i + 1,
    name: b.place,
    days: b.nights,
    lat: b.lat,
    lng: b.lng,
  }));
}

export function firstBase(trip: PresetTrip): { lat: number; lng: number } {
  const base = trip.legs.find((l) => l.kind === "base");
  return base && base.kind === "base" ? base : { lat: 0, lng: 0 };
}
