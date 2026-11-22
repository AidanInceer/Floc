import { globeDrag } from "@/components/globe/globe-drag";
import type { globePainter } from "@/components/globe/paint-globe";
import type { globeTurn } from "@/components/globe/globe-turn";

import type { tripView } from "./trip-view";

type Radius = NonNullable<ReturnType<typeof globePainter>>["radius"];
type Hooks = { grabbed: () => void; settle: (ms: number) => void; still: () => boolean };

export function spinDrag(
  canvas: HTMLCanvasElement,
  radius: Radius,
  face: ReturnType<typeof globeTurn>,
  trip: ReturnType<typeof tripView>,
  { grabbed, settle, still }: Hooks,
) {
  return globeDrag(canvas, {
    radius,
    view: face.view,
    turnTo(view) {
      if (!trip.running()) face.turnTo(view);
    },
    onGrab() {
      face.halt();
      grabbed();
    },
    onRelease(speed) {
      if (trip.isOpen()) return;
      face.flick(speed);
      if (Math.abs(speed) < 0.04 || still()) settle(700);
    },
  });
}
