import type { LatLng } from "@floc/globe/sphere";

/** Two first stops nearer than this, in degrees, stand on one spot of the dome. */
const NEAR = 0.7;

const near = (a: LatLng, b: LatLng) => Math.hypot(a.lat - b.lat, (a.lng - b.lng) * Math.cos((a.lat * Math.PI) / 180)) < NEAR;

/**
 * Why: two trips that start in one town (Sydney, Cape Town) drew one pin on top of the other, so one trip had no pin to press.
 * Each pin gets its place in a row across the town, in steps: -0.5 and 0.5 for two, -1, 0 and 1 for three.
 */
export function pinSteps(places: readonly LatLng[]): number[] {
  const town = places.map((p) => places.findIndex((q) => near(q, p)));
  return places.map((_, i) => {
    const row = town.flatMap((t, k) => (t === town[i] ? [k] : []));
    return row.indexOf(i) - (row.length - 1) / 2;
  });
}
