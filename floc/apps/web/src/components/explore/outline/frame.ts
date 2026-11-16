import type { Box, Piece, Spot } from "./land";

export type Size = { width: number; height: number };
export type Frame = {
  view: Box;
  scale: number;
  point: (spot: Spot) => { x: number; y: number };
};

const SMALLEST = 4.5;
const LARGEST = 17;
const IN_A_BIG_COUNTRY = 11;
const SHORE = 0.6;
const LAND_MARGIN = 1.12;
const ROUTE_MARGIN = 1.5;
const REACH = 0.34;
const APART = 0.15;
const TIGHTEST = 0.3;
const KEEP = 0.4;
const ISLAND = 1.2;
const BIG_ISLAND = 0.1;

const area = (b: Box) => (b.east - b.west) * (b.north - b.south);
const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

export function homePiece(land: readonly Piece[], code: string, first: Spot): Piece | undefined {
  return land
    .filter(({ code: c, box }) =>
      c === code && first.lng > box.west - SHORE && first.lng < box.east + SHORE && first.lat > box.south - SHORE && first.lat < box.north + SHORE)
    .sort((a, b) => area(b.box) - area(a.box))[0];
}

function routeBox(stops: readonly Spot[]): Box {
  const lats = stops.map((s) => s.lat);
  const lngs = stops.map((s) => s.lng);
  return { west: Math.min(...lngs), south: Math.min(...lats), east: Math.max(...lngs), north: Math.max(...lats) };
}

function closest(stops: readonly Spot[], squeeze: number): number {
  let least = Infinity;
  stops.forEach((a, i) => {
    for (const b of stops.slice(i + 1)) {
      const apart = Math.hypot(a.lat - b.lat, (a.lng - b.lng) * squeeze);
      if (apart > 1e-6) least = Math.min(least, apart);
    }
  });
  return least === Infinity ? 0 : least;
}

export function frameFor(stops: readonly Spot[], home: Piece | undefined, size: Size, also: readonly Spot[] = []): Frame {
  const route = routeBox([...stops, ...also]);
  const middle = { lng: (route.west + route.east) / 2, lat: (route.south + route.north) / 2 };
  const squeeze = Math.cos((middle.lat * Math.PI) / 180);
  const across = size.width / size.height;
  const needs = (b: Box) => Math.max(b.north - b.south, ((b.east - b.west) * squeeze) / across);

  let high = home ? IN_A_BIG_COUNTRY : SMALLEST;
  let centre = middle;
  if (home && needs(home.box) * LAND_MARGIN <= LARGEST) {
    high = needs(home.box) * LAND_MARGIN;
    centre = { lng: (home.box.west + home.box.east) / 2, lat: (home.box.south + home.box.north) / 2 };
  }
  const whole = high;
  high = Math.max(high, needs(route) * ROUTE_MARGIN, SMALLEST);
  const gap = closest(stops, squeeze);
  if (gap > 0 && gap / high < APART) high = Math.min(high, Math.max(gap / APART, needs(route) * ROUTE_MARGIN, TIGHTEST, whole * KEEP));

  const wide = (high * across) / squeeze;
  centre = {
    lng: clamp(centre.lng, route.east - wide * REACH, route.west + wide * REACH),
    lat: clamp(centre.lat, route.north - high * REACH, route.south + high * REACH),
  };
  return frameOn(centre, high, squeeze, size);
}

function frameOn(centre: Spot, high: number, squeeze: number, size: Size): Frame {
  const wide = (high * (size.width / size.height)) / squeeze;
  const scale = size.height / high;
  return {
    scale,
    view: { west: centre.lng - wide / 2, south: centre.lat - high / 2, east: centre.lng + wide / 2, north: centre.lat + high / 2 },
    point: ({ lat, lng }) => ({ x: size.width / 2 + (lng - centre.lng) * squeeze * scale, y: size.height / 2 - (lat - centre.lat) * scale }),
  };
}

function landArea(ring: readonly number[][]): number {
  let twice = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) twice += (ring[j]![0]! + ring[i]![0]!) * (ring[j]![1]! - ring[i]![1]!);
  return Math.abs(twice) / 2;
}

export function countryFrame(land: readonly Piece[], code: string, size: Size): Frame | null {
  const pieces = land.filter((p) => p.code === code).map((p) => ({ box: p.box, area: landArea(p.ring) })).sort((a, b) => b.area - a.area);
  const largest = pieces[0];
  if (!largest) return null;
  const reach = Math.max(largest.box.east - largest.box.west, largest.box.north - largest.box.south);
  const gap = (b: Box) => Math.max(b.west - largest.box.east, largest.box.west - b.east, b.south - largest.box.north, largest.box.south - b.north, 0);
  const big = pieces.filter((p) => p.area >= largest.area * BIG_ISLAND && gap(p.box) <= reach);
  const all = {
    west: Math.min(...big.map((p) => p.box.west)),
    east: Math.max(...big.map((p) => p.box.east)),
    south: Math.min(...big.map((p) => p.box.south)),
    north: Math.max(...big.map((p) => p.box.north)),
  };
  const box = all.east - all.west > 180 ? largest.box : all;
  const centre = { lng: (box.west + box.east) / 2, lat: (box.south + box.north) / 2 };
  const squeeze = Math.cos((centre.lat * Math.PI) / 180);
  const needs = Math.max(box.north - box.south, ((box.east - box.west) * squeeze) / (size.width / size.height));
  return frameOn(centre, Math.max(needs * LAND_MARGIN, ISLAND), squeeze, size);
}
