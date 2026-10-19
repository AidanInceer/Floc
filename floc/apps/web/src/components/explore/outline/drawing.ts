import { clipRing } from "./clip";
import { frameFor, homePiece, type Frame, type Size } from "./frame";
import { onLand, type Box, type Piece, type Spot } from "./land";
import { ringPath } from "./ring-path";
import { thin } from "./thin";

type Point = { x: number; y: number };

/** The land under a listing's route, in the drawing's own pixels, and the frame that puts a place on it. */
type Drawing = { home: string; other: string; islets: (Point & { r: number })[]; frame: Frame | null };

const ISLET = 9;
const GAP = 1.5;
// Why: past the drawing's edge by more than a corner's ease, so a cut never shows.
const BLEED = 12;

const tenth = (value: number) => Math.round(value * 10) / 10;
const touches = (a: Box, b: Box) => a.east >= b.west && a.west <= b.east && a.north >= b.south && a.south <= b.north;

function landPaths(land: readonly Piece[], codes: ReadonlySet<string>, frame: Frame, size: Size) {
  const paths = { home: "", other: "" };
  const bleed = { left: -BLEED, top: -BLEED, right: size.width + BLEED, bottom: size.height + BLEED };
  for (const piece of land) {
    if (!touches(piece.box, frame.view)) continue;
    const drawn = clipRing(piece.ring.map(([lng, lat]) => frame.point({ lng: lng!, lat: lat! })), bleed);
    paths[codes.has(piece.code) ? "home" : "other"] += ringPath(thin(drawn, GAP));
  }
  return paths;
}

/** Land anywhere within `r` drawing pixels of the stop, so its mark already sits on the coast. */
function nearLand(land: readonly Piece[], stop: Spot, r: number, scale: number) {
  const lat = r / scale;
  const lng = lat / Math.cos((stop.lat * Math.PI) / 180);
  return Array.from({ length: 12 }, (_, k) => (k * Math.PI) / 6).some((a) =>
    onLand(land, { lat: stop.lat + lat * Math.sin(a), lng: stop.lng + lng * Math.cos(a) }));
}

/**
 * A listing's countries cut from the outline file, with no tiles: `codes` are filled as the trip's own, the rest of the land
 * plain. The frame fits the first stop's country when it can, the route when it cannot.
 */
export function drawOutline(stops: readonly Spot[], codes: ReadonlySet<string>, land: readonly Piece[], size: Size): Drawing {
  if (stops.length === 0) return { home: "", other: "", islets: [], frame: null };
  const first = [...codes][0] ?? "";
  const frame = frameFor(stops, homePiece(land, first, stops[0]!), size);
  // Why: an islet under the outline's detail can fall in the sea; a patch of land under it says there is ground here. A town
  // on the shore needs none: its mark already touches the coast, and a patch there reads as a smudge.
  const islets = land.length === 0 ? [] : stops.flatMap((stop) => {
    const r = Math.max(ISLET, frame.scale * 0.12);
    if (onLand(land, stop) || nearLand(land, stop, r, frame.scale)) return [];
    const p = frame.point(stop);
    return [{ x: tenth(p.x), y: tenth(p.y), r: tenth(r) }];
  });
  return { ...landPaths(land, codes, frame, size), islets, frame };
}
