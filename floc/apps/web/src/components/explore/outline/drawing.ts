import { spread } from "@/components/explore/atlas/pin-spread";
import { placeTags } from "@/components/explore/atlas/tag-place";

import { clipRing } from "./clip";
import { frameFor, homePiece, type Frame, type Size } from "./frame";
import { onLand, type Box, type Piece, type Spot } from "./land";
import { ringPath } from "./ring-path";
import { thin } from "./thin";

type Stop = Spot & { place: string };
type Point = { x: number; y: number };

/** Everything the locator draws, in the drawing's own pixels. */
type Drawing = {
  home: string;
  other: string;
  islets: (Point & { r: number })[];
  way: string;
  pins: (Point & { label: string })[];
  names: (Point & { text: string })[];
};

/** A numbered pin with its name beside it, or a plain dot on a tile. */
const NAMED = { gap: 21, islet: 13 };
const PLAIN = { gap: 10, islet: 7 };
const GAP = 1.5;
// Why: past the drawing's edge by more than a corner's ease, so a cut never shows.
const BLEED = 12;
const NAME = { letter: 6.5, pad: 4, height: 14, baseline: 11, edge: 4 };

const tenth = (value: number) => Math.round(value * 10) / 10;
const round = (p: Point): Point => ({ x: tenth(p.x), y: tenth(p.y) });
const touches = (a: Box, b: Box) => a.east >= b.west && a.west <= b.east && a.north >= b.south && a.south <= b.north;

function landPaths(land: readonly Piece[], code: string, frame: Frame, size: Size) {
  const paths = { home: "", other: "" };
  const bleed = { left: -BLEED, top: -BLEED, right: size.width + BLEED, bottom: size.height + BLEED };
  for (const piece of land) {
    if (!touches(piece.box, frame.view)) continue;
    const drawn = clipRing(piece.ring.map(([lng, lat]) => frame.point({ lng: lng!, lat: lat! })), bleed);
    paths[piece.code === code ? "home" : "other"] += ringPath(thin(drawn, GAP));
  }
  return paths;
}

/** One entry a place: a route that comes back (Puerto Natales) shares the pin. */
function placesOf(stops: readonly Stop[]) {
  const places: { stop: Stop; visits: number[] }[] = [];
  const order = stops.map((stop, i) => {
    let at = places.findIndex((p) => p.stop.lat === stop.lat && p.stop.lng === stop.lng);
    if (at < 0) at = places.push({ stop, visits: [] }) - 1;
    places[at]!.visits.push(i + 1);
    return at;
  });
  return { places, order };
}

function namesFor(places: { stop: Stop }[], pins: Point[], route: Point[], size: Size): Drawing["names"] {
  const sizes = places.map(({ stop }) => ({ width: stop.place.length * NAME.letter + NAME.pad, height: NAME.height }));
  const view = { left: NAME.edge, top: NAME.edge, right: size.width - NAME.edge, bottom: size.height - NAME.edge };
  return placeTags(pins, sizes, view, route).map((offset, i) => ({
    ...round({ x: pins[i]!.x + offset.x, y: pins[i]!.y + offset.y + NAME.baseline }),
    text: places[i]!.stop.place,
  }));
}

/**
 * A listing as a small map with no tiles: the country cut from the outline file, the route on top.
 * `named` is the large drawing: numbered pins with the place beside each. Without it, plain dots for a tile.
 */
export function drawOutline(stops: readonly Stop[], code: string, land: readonly Piece[], size: Size, named: boolean): Drawing {
  if (stops.length === 0) return { home: "", other: "", islets: [], way: "", pins: [], names: [] };
  const look = named ? NAMED : PLAIN;
  const frame = frameFor(stops, homePiece(land, code, stops[0]!), size);
  const { places, order } = placesOf(stops);
  const real = places.map(({ stop }) => frame.point(stop));
  const pins = spread(real, look.gap).map(round);
  const route = order.map((at) => pins[at]!);
  // Why: an islet under the outline's detail, or a town on the shore, can fall in the sea. A patch of land under it says there is ground here.
  const islets = land.length === 0 ? [] : places.flatMap(({ stop }, i) =>
    onLand(land, stop) ? [] : [{ ...round(real[i]!), r: tenth(Math.max(look.islet, frame.scale * 0.12)) }]);
  return {
    ...landPaths(land, code, frame, size),
    islets,
    way: route.length > 1 ? `M${route.map((p) => `${p.x} ${p.y}`).join("L")}` : "",
    pins: pins.map((p, i) => ({ ...p, label: places[i]!.visits.join("·") })),
    names: named ? namesFor(places, pins, route, size) : [],
  };
}
