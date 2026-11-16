import type { LatLng } from "@floc/globe/sphere";

const NEAR = 0.7;

const near = (a: LatLng, b: LatLng) => Math.hypot(a.lat - b.lat, (a.lng - b.lng) * Math.cos((a.lat * Math.PI) / 180)) < NEAR;

export function pinSteps(places: readonly LatLng[]): number[] {
  const town = places.map((p) => places.findIndex((q) => near(q, p)));
  return places.map((_, i) => {
    const row = town.flatMap((t, k) => (t === town[i] ? [k] : []));
    return row.indexOf(i) - (row.length - 1) / 2;
  });
}
