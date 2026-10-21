import type { Packed } from "@/lib/land/pack-land";

export type Spot = { lat: number; lng: number };
export type Box = { west: number; south: number; east: number; north: number };
/** One closed shape of land: a mainland or an island, as `[lng, lat]` points. */
export type Piece = { code: string; ring: number[][]; box: Box };
export type Geo = { features: { id?: string | number; geometry: { type: string; coordinates: unknown } }[] };

function boxOf(ring: number[][]): Box {
  const box = { west: Infinity, south: Infinity, east: -Infinity, north: -Infinity };
  for (const [lng, lat] of ring as [number, number][]) {
    box.west = Math.min(box.west, lng);
    box.east = Math.max(box.east, lng);
    box.south = Math.min(box.south, lat);
    box.north = Math.max(box.north, lat);
  }
  return box;
}

/** The outer ring of every landmass in `countries-110m.geojson`. Holes (a lake, an enclave) are not drawn. */
export function landFrom(geo: Geo): Piece[] {
  return geo.features.flatMap(({ id, geometry }) => {
    const polygons =
      geometry.type === "Polygon" ? [geometry.coordinates as number[][][]]
      : geometry.type === "MultiPolygon" ? (geometry.coordinates as number[][][][])
      : [];
    return polygons.map((polygon) => ({ code: String(id ?? ""), ring: polygon[0]!, box: boxOf(polygon[0]!) }));
  });
}

function unpack(flat: number[]): number[][] {
  const ring: number[][] = [];
  let [x, y] = [0, 0];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    x += flat[i]!;
    y += flat[i + 1]!;
    ring.push([x / 100, y / 100]);
  }
  return ring;
}

/** The 1:50m outline, packed by `packLand` to a third of its GeoJSON size. */
export function landFromPacked(packed: Packed): Piece[] {
  return Object.entries(packed).flatMap(([code, rings]) =>
    rings.map((flat) => {
      const ring = unpack(flat);
      return { code, ring, box: boxOf(ring) };
    }),
  );
}

function inRing({ lat, lng }: Spot, ring: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i] as [number, number];
    const [xj, yj] = ring[j] as [number, number];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function onLand(land: readonly Piece[], spot: Spot): boolean {
  return land.some((piece) => inRing(spot, piece.ring));
}

const within = ({ lat, lng }: Spot, b: Box) => lng >= b.west && lng <= b.east && lat >= b.south && lat <= b.north;

/** The countries a set of places stand in. A place in the sea, or on a shore the outline misses, adds none. */
export function codesAt(land: readonly Piece[], spots: readonly Spot[]): Set<string> {
  const codes = spots.map((spot) => land.find((piece) => within(spot, piece.box) && inRing(spot, piece.ring))?.code);
  return new Set(codes.filter((code): code is string => Boolean(code)));
}

/** The outline of each country in `codes`, from both outlines, for a globe to fill in. */
export function ringsIn(world: readonly Piece[], fine: readonly Piece[], codes: ReadonlySet<string>): Set<number[][]> {
  return new Set([...world, ...fine].filter((piece) => codes.has(piece.code)).map((piece) => piece.ring));
}
