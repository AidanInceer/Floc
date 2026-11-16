import type { LatLng } from "@floc/globe/sphere";

import type { globePainter } from "@/components/globe/paint-globe";

type Painter = NonNullable<ReturnType<typeof globePainter>>;

type Pins = { view: LatLng; home: LatLng; places: LatLng[]; hand: number[]; at: number; held: number; still: boolean };

const PULSE_MS = 1500;

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
