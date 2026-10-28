import { capOf, type LatLng } from "./sphere";

export type Box = { west: number; south: number; east: number; north: number };
/** One closed shape of a country, as `[lng, lat]` points, with the box and the circle that hold it. */
export type Shape = { code: string; ring: number[][]; box: Box; centre: LatLng; reach: number };
/** A country too small to draw at 1:110m (Malta, Singapore), kept as one place. */
export type Dot = { code: string; at: LatLng };
export type Countries = { shapes: Shape[]; dots: Dot[] };
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

function shapeOf(code: string, ring: number[][]): Shape {
  return { code, ring, box: boxOf(ring), ...capOf(ring) };
}

/** Every country in `countries-110m.geojson`: the outer ring of each landmass, and a dot for each point. Holes are not drawn. */
export function countriesFrom(geo: Geo): Countries {
  const land: Countries = { shapes: [], dots: [] };
  for (const { id, geometry } of geo.features) {
    const code = String(id ?? "");
    if (geometry.type === "Point") {
      const [lng, lat] = geometry.coordinates as [number, number];
      land.dots.push({ code, at: { lng, lat } });
    } else if (geometry.type === "Polygon") {
      land.shapes.push(shapeOf(code, (geometry.coordinates as number[][][])[0]!));
    } else if (geometry.type === "MultiPolygon") {
      for (const polygon of geometry.coordinates as number[][][][]) land.shapes.push(shapeOf(code, polygon[0]!));
    }
  }
  return land;
}

/** Where a country is: its dot, or the middle of its largest shape. Null when the outline does not have it. */
export function middleOf(land: Countries, code: string): LatLng | null {
  const dot = land.dots.find((d) => d.code === code);
  if (dot) return dot.at;
  const own = land.shapes.filter((s) => s.code === code);
  if (own.length === 0) return null;
  return own.reduce((big, s) => (s.ring.length > big.ring.length ? s : big), own[0]).centre;
}
