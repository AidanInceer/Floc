import type { LatLng } from "@/lib/landing/globe/sphere";

import type { globePainter } from "./paint-globe";

type Painter = NonNullable<ReturnType<typeof globePainter>>;

/** `hand` is the places with a tile, `at` the one the globe is on, `held` the one whose tile is under the pointer (or -1). */
type Pins = { view: LatLng; home: LatLng; places: LatLng[]; hand: number[]; at: number; held: number; still: boolean };

const PULSE_MS = 1500;

/**
 * The globe's pins: home, a pin for each place with a tile, a dot for every other place.
 * Why: as the way in opens (`deep`), the other places leave first and the trip's own pin hands over to its numbered stops.
 */
export function drawPins(paint: Painter, { view, home, places, hand, at, held, still }: Pins, now: number, deep: number) {
  if (deep >= 0.6) return;
  if (deep >= 0.3) return paint.pin(view, places[at]!, 7, true);
  const beat = still ? 0.4 : (now % PULSE_MS) / PULSE_MS;
  const swell = (i: number) => (i === held && !still ? 1 + 0.1 * Math.sin(beat * Math.PI * 2) : 1);
  places.forEach((p, i) => !hand.includes(i) && i !== at && paint.spot(view, p));
  if (held >= 0) paint.pulse(view, places[held]!, held === at ? 7 : 4, beat);
  hand.forEach((i) => i !== at && paint.pin(view, places[i]!, 4 * swell(i), i === held));
  paint.pin(view, home, 4, true);
  paint.pin(view, places[at]!, 7 * swell(at), true);
}
