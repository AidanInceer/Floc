import type { globePainter } from "@/components/globe/paint-globe";
import type { LatLng } from "@/lib/landing/globe/sphere";

type Painter = NonNullable<ReturnType<typeof globePainter>>;

const clamp = (v: number) => Math.min(1, Math.max(0, v));
const at = (q: { x: number; y: number }) => `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px)`;

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
