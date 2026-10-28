import type { Countries } from "./countries";
import { arc, type LatLng } from "./sphere";

function inRing({ lat, lng }: LatLng, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as [number, number];
    const [xj, yj] = ring[j] as [number, number];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/**
 * The country at a place on the globe, or null in the sea.
 * Why the dots come first: a small country is a dot inside or beside a larger shape, and must win within `reach` degrees.
 */
export function countryAt(land: Countries, at: LatLng, reach: number): string | null {
  let best: string | null = null;
  let nearest = reach;
  for (const dot of land.dots) {
    const d = arc(dot.at, at);
    if (d < nearest) [best, nearest] = [dot.code, d];
  }
  if (best) return best;
  const { lat, lng } = at;
  const hit = land.shapes.find(({ box, ring }) => lng >= box.west && lng <= box.east && lat >= box.south && lat <= box.north && inRing(at, ring));
  return hit?.code ?? null;
}
