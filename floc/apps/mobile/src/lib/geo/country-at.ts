// Why: a place saved before ticket 95 has no country stored, so the outline says where it stands — as the web's `codesAt` does.
import COUNTRY_SHAPES from "../countries-110m.json";

type Ring = number[][];
type Shape = { id?: string | number; geometry: { type: string; coordinates: unknown } };

const SHAPES = (COUNTRY_SHAPES as unknown as { features: Shape[] }).features;

function inRing([x, y]: [number, number], ring: Ring): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = [ring[i]![0]!, ring[i]![1]!];
    const [xj, yj] = [ring[j]![0]!, ring[j]![1]!];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

const polygons = (g: Shape["geometry"]): Ring[][] =>
  g.type === "Polygon" ? [g.coordinates as Ring[]] : g.type === "MultiPolygon" ? (g.coordinates as Ring[][]) : [];

function countryAt(point: [number, number]): string | null {
  const hit = SHAPES.find((f) => polygons(f.geometry).some(([outer, ...holes]) => outer !== undefined && inRing(point, outer) && !holes.some((h) => inRing(point, h))));
  return hit?.id === undefined ? null : String(hit.id);
}

/** The countries the points stand in, first seen first. */
export function countriesAt(points: { lat: number; lng: number }[]): string[] {
  const codes: string[] = [];
  for (const p of points) {
    const code = countryAt([p.lng, p.lat]);
    if (code && !codes.includes(code)) codes.push(code);
  }
  return codes;
}
