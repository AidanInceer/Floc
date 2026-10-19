import type { globePainter } from "@/components/landing/globe/paint-globe";
import type { StopPin } from "@/lib/landing/globe/deep";
import type { LatLng } from "@/lib/landing/globe/sphere";

import { legPart, type Fit } from "./dome";

type Painter = NonNullable<ReturnType<typeof globePainter>>;
type Spot = { x: number; y: number; z: number };
/**
 * One trip, open: its places as pins, how far each pin is moved off its place so none overlap,
 * the line between stops, and how far along that line each stop is (`marks`).
 */
export type Route = { pins: StopPin[]; offs: { x: number; y: number }[]; hops: LatLng[][]; marks: number[]; fit: Fit };

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const at = (q: { x: number; y: number }) => `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px)`;

/** The route between stops: the whole of it faint, and in pen as far as `drawn` of its length, with a dot at the pen's tip. */
export function drawRoute(paint: Painter, view: LatLng, route: Route, drawn: number, alpha: number) {
  if (!alpha) return;
  route.hops.forEach((hop, k) => {
    const last = hop.length - 1;
    paint.line(view, hop, last, 2, "edge", alpha);
    const part = legPart(drawn, route.marks, k);
    if (!part) return;
    const upTo = Math.max(1, Math.round(last * part));
    paint.line(view, hop, upTo, 5.5, "sheet", alpha);
    paint.line(view, hop, upTo, 2.4, "pen", alpha);
    if (part < 1) paint.pin(view, hop[upTo]!, 3, true);
  });
}

type Flying = { route: number; landing: number };

/** The dashed line from home and the plane on it. Both leave as a route opens (`alpha`). */
export function drawFlight(paint: Painter, view: LatLng, home: LatLng, path: LatLng[], f: Flying, alpha: number) {
  if (!alpha) return;
  paint.faded(alpha, () => {
    if (f.route) paint.route(view, path, f.route);
    paint.pin(view, home, 4, true);
  });
  if (f.route && alpha === 1) paint.plane(view, path, f.route, f.landing);
}

/** Moves each trip's pin to its place; a pin near the edge of the dome fades, and all of them leave as a route opens (`fade`). */
export function moveFlags(paint: Painter, flags: HTMLElement, places: LatLng[], view: LatLng, fade: number) {
  places.forEach((place, i) => {
    const el = flags.children[i] as HTMLElement | undefined;
    if (!el) return;
    const q = paint.place(view, place);
    const seen = clamp((q.z - 0.15) * 6) * fade;
    el.style.transform = at(q);
    el.style.opacity = seen.toFixed(2);
    el.hidden = seen === 0;
  });
}

/**
 * Moves the open route's pins; a stop shows once the line has reached it (`drawn`, or null while the map is not yet in).
 * Hands back where each pin is and how many show.
 */
export function moveStops(paint: Painter, stops: HTMLElement, route: Route, view: LatLng, drawn: number | null) {
  let shown = 0;
  const spots: Spot[] = route.pins.map((pin, k) => {
    const q = paint.place(view, pin);
    return { x: q.x + route.offs[k]!.x, y: q.y + route.offs[k]!.y, z: q.z };
  });
  spots.forEach((q, k) => {
    const el = stops.children[k] as HTMLElement | undefined;
    if (!el) return;
    el.style.transform = at(q);
    el.hidden = q.z < 0.05 || drawn === null || route.marks[route.pins[k]!.stops[0]!]! > drawn + 0.001;
    if (!el.hidden) shown++;
  });
  return { spots, shown };
}
