import type { Box, Piece, Spot } from "./land";

export type Size = { width: number; height: number };
export type Frame = {
  view: Box;
  /** Pixels to a degree of latitude. */
  scale: number;
  point: (spot: Spot) => { x: number; y: number };
};

/** How many degrees of latitude the drawing is high. */
const SMALLEST = 4.5;
const LARGEST = 17;
const IN_A_BIG_COUNTRY = 11;
// Why: at 1:110m a coast can sit half a degree from the town on it.
const SHORE = 0.6;
const LAND_MARGIN = 1.12;
const ROUTE_MARGIN = 1.5;
/** A stop stays inside the middle 68% of the drawing. */
const REACH = 0.34;
/** The two closest stops sit at least this share of the drawing's height apart, so each mark and the line between them can be seen. */
const APART = 0.2;
/** The most a route is zoomed in on to hold its closest stops apart: a town and its neighbour. */
const TIGHTEST = 0.3;

const area = (b: Box) => (b.east - b.west) * (b.north - b.south);
const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high);

/** The landmass of the country that the first stop is on: the mainland, not an island on the far side. */
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

/** The distance, in degrees of latitude, between the two closest stops that are not the same place; 0 when there are not two. */
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

/** Why: a reader knows a country by its whole shape, so the frame is the landmass when it fits and the route only when it does not. */
export function frameFor(stops: readonly Spot[], home: Piece | undefined, size: Size): Frame {
  const route = routeBox(stops);
  const middle = { lng: (route.west + route.east) / 2, lat: (route.south + route.north) / 2 };
  // Why: a degree of longitude is narrower away from the equator; one factor for the whole small drawing is close enough.
  const squeeze = Math.cos((middle.lat * Math.PI) / 180);
  const across = size.width / size.height;
  const needs = (b: Box) => Math.max(b.north - b.south, ((b.east - b.west) * squeeze) / across);

  let high = home ? IN_A_BIG_COUNTRY : SMALLEST;
  let centre = middle;
  if (home && needs(home.box) * LAND_MARGIN <= LARGEST) {
    high = needs(home.box) * LAND_MARGIN;
    centre = { lng: (home.box.west + home.box.east) / 2, lat: (home.box.south + home.box.north) / 2 };
  }
  high = Math.max(high, needs(route) * ROUTE_MARGIN, SMALLEST);
  const gap = closest(stops, squeeze);
  // Why: a country-sized frame puts stops a few miles apart on top of each other; zoom in until they part, but never past the whole route.
  if (gap > 0 && gap / high < APART) {
    high = Math.min(high, Math.max(gap / APART, needs(route) * ROUTE_MARGIN, TIGHTEST));
    centre = middle;
  }

  const wide = (high * across) / squeeze;
  centre = {
    lng: clamp(centre.lng, route.east - wide * REACH, route.west + wide * REACH),
    lat: clamp(centre.lat, route.north - high * REACH, route.south + high * REACH),
  };
  const scale = size.height / high;
  return {
    scale,
    view: { west: centre.lng - wide / 2, south: centre.lat - high / 2, east: centre.lng + wide / 2, north: centre.lat + high / 2 },
    point: ({ lat, lng }) => ({ x: size.width / 2 + (lng - centre.lng) * squeeze * scale, y: size.height / 2 - (lat - centre.lat) * scale }),
  };
}
