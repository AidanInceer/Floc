import type { PresetTrip, Region } from "@floc/core/trip/explore/preset-trips";

// Same families as the app's `region-tint.ts`, so a region is one colour on both.
const REGION_SKIN: Record<Region, string> = {
  Europe: "bg-peri text-peri-ink",
  Africa: "bg-butter text-butter-ink",
  Asia: "bg-blush text-blush-ink",
  Americas: "bg-mint text-mint-ink",
  Oceania: "bg-pen-soft text-pen-deep",
};

export function skinFor(trip: PresetTrip): string {
  return REGION_SKIN[trip.region];
}

export function basePlaces(trip: PresetTrip): string[] {
  return trip.legs.filter((l) => l.kind === "base").map((l) => l.place);
}

export function legLine(leg: PresetTrip["legs"][number]): string {
  if (leg.kind === "hop") return `${leg.place} · ${leg.detail}`;
  return `${leg.place} · ${leg.nights} ${leg.nights === 1 ? "night" : "nights"}`;
}

export function firstBase(trip: PresetTrip): { lat: number; lng: number } {
  const base = trip.legs.find((l) => l.kind === "base");
  return base && base.kind === "base" ? base : { lat: 0, lng: 0 };
}
