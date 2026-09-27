const TILE = 256;
const MAX_ZOOM = 9;
/** Top and bottom margin for a route taller than it is wide (Vietnam), which the full margin holds a zoom level too far out. */
const TALL_PAD = 20;

type LatLng = { lat: number; lng: number };
type Box = { width: number; height: number; pad: number };
export type Point = [number, number];
type CropTile = { zoom: number; x: number; y: number; left: number; top: number };
export type RouteCrop = { zoom: number; tiles: CropTile[]; points: Point[] };

function mercator({ lat, lng }: LatLng, zoom: number): Point {
  const size = TILE * 2 ** zoom;
  const sin = Math.sin((lat * Math.PI) / 180);
  return [((lng + 180) / 360) * size, (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * size];
}

/** Server and browser differ in the last digits of Math.log; rounding keeps hydration identical. */
const round = (n: number) => Math.round(n * 10) / 10;

function span(points: Point[], axis: 0 | 1) {
  const values = points.map((p) => p[axis]);
  return { min: Math.min(...values), max: Math.max(...values) };
}

function fits(points: Point[], box: Box) {
  const x = span(points, 0);
  const y = span(points, 1);
  const padY = y.max - y.min > x.max - x.min ? TALL_PAD : box.pad;
  return x.max - x.min <= box.width - 2 * box.pad && y.max - y.min <= box.height - 2 * padY;
}

/** A still crop of the web map around a route: which tiles to lay where, and where each stop falls, in box pixels. */
export function routeCrop(stops: LatLng[], box: Box): RouteCrop {
  let zoom = MAX_ZOOM;
  while (zoom > 1 && !fits(stops.map((s) => mercator(s, zoom)), box)) zoom--;
  const world = stops.map((s) => mercator(s, zoom));
  const x = span(world, 0);
  const y = span(world, 1);
  const ox = (x.min + x.max) / 2 - box.width / 2;
  const oy = (y.min + y.max) / 2 - box.height / 2;
  const columns = 2 ** zoom;
  const tiles: CropTile[] = [];
  for (let tx = Math.floor(ox / TILE); tx <= Math.floor((ox + box.width) / TILE); tx++) {
    for (let ty = Math.floor(oy / TILE); ty <= Math.floor((oy + box.height) / TILE); ty++) {
      tiles.push({ zoom, x: ((tx % columns) + columns) % columns, y: ty, left: round(tx * TILE - ox), top: round(ty * TILE - oy) });
    }
  }
  return { zoom, tiles, points: world.map(([px, py]) => [round(px - ox), round(py - oy)]) };
}
