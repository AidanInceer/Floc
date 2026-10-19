type Feature = { properties: Record<string, unknown>; geometry: { type: string; coordinates: unknown } };
/** Each country's rings as whole hundredths of a degree: the first point, then the step to each next one. */
export type Packed = Record<string, number[][]>;

// Same folds as build-countries.mjs, so a code means the same shape in both files.
const FOLD: Record<string, string> = { CYN: "CY", SOL: "SO" };
// 0.01° is about 1 km: under a pixel at Explore's closest zoom.
const TOLERANCE = 0.01;
const SMALLEST_RING = 4;

function codeOf(p: Record<string, unknown>): string | null {
  const code = p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : FOLD[String(p.ADM0_A3)];
  return typeof code === "string" && code.length === 2 ? code : null;
}

/** Douglas-Peucker: the fewest points that keep the line within `tolerance` degrees of where it was. */
export function simplify(points: number[][], tolerance: number): number[][] {
  if (points.length < 5) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const spans = [[0, points.length - 1]];
  while (spans.length) {
    const [a, b] = spans.pop()!;
    const [[ax, ay], [bx, by]] = [points[a!]!, points[b!]!] as [number, number][];
    const [dx, dy] = [bx - ax, by - ay];
    const length = Math.hypot(dx, dy);
    let [far, at] = [-1, -1];
    for (let i = a! + 1; i < b!; i++) {
      const [px, py] = points[i] as [number, number];
      const d = length ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / length : Math.hypot(px - ax, py - ay);
      if (d > far) [far, at] = [d, i];
    }
    if (far > tolerance) {
      keep[at] = 1;
      spans.push([a!, at], [at, b!]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function packRing(ring: number[][]): number[] | null {
  const flat: number[] = [];
  let [x0, y0] = [0, 0];
  for (const [lng, lat] of simplify(ring, TOLERANCE)) {
    const [x, y] = [Math.round(lng! * 100), Math.round(lat! * 100)];
    if (flat.length && x === x0 && y === y0) continue;
    flat.push(x - x0, y - y0);
    [x0, y0] = [x, y];
  }
  return flat.length >= SMALLEST_RING * 2 ? flat : null;
}

/** Natural Earth countries as `landFromPacked` reads them: each country's outer rings, thinned and packed. */
export function packLand(geo: { features: Feature[] }): Packed {
  const land: Packed = {};
  for (const { properties, geometry } of geo.features) {
    const code = codeOf(properties);
    if (!code) continue;
    const polys = (geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates) as number[][][][];
    const rings = polys.map((poly) => packRing(poly[0]!)).filter((ring) => ring !== null);
    if (rings.length) land[code] = [...(land[code] ?? []), ...rings];
  }
  return land;
}
