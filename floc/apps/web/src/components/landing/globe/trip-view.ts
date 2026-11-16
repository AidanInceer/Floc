import type { LatLng } from "@floc/globe/sphere";

import type { Box } from "@/components/explore/atlas/tag-place";
import type { Fit } from "@/components/explore/globe/dome";
import { fitOf, poseOf, tripLayer, type TripTint } from "@/components/explore/globe/trip-layer";
import type { globePainter } from "@/components/globe/paint-globe";
import type { globeTurn } from "@/components/globe/globe-turn";
import type { TripRoute } from "@/lib/explore/route/trip-route";

import { liveTint } from "./trip-tint";
import { wayIn, type WayDom } from "./way-in";

type Painter = NonNullable<ReturnType<typeof globePainter>>;
type Face = ReturnType<typeof globeTurn>;

const NARROW = "(max-width: 900px)";
const PANEL = 352;
const BACK = 40;
const FOOT = 48;

export function tripView(canvas: HTMLCanvasElement, paint: Painter, face: Face, onWay: (state: "open" | "shut") => void) {
  const way = wayIn(paint, opened);
  const trips = tripLayer(canvas, paint, { foot: 0, edge: 24, slow: 1.3 });
  let route: TripRoute | null = null;
  let fill: (() => TripTint) | null = null;
  let tint: TripTint | null = null;
  let moving: Fit | null = null;
  const clear = (): Box => {
    const narrow = matchMedia(NARROW).matches;
    return { left: 0, top: narrow ? 0 : BACK, right: canvas.clientWidth - (narrow ? 0 : PANEL), bottom: canvas.clientHeight - FOOT };
  };
  const width = () => clear().right - clear().left;
  const fitNow = (box: { w: number; h: number }) => moving ?? trips.rest(width()) ?? way.frame(box);
  const poseNow = () => poseOf(fitNow(paint.box())!, face.view(), width());

  function opened(state: "open" | "shut") {
    if (state === "open" && route && tint) {
      face.halt();
      trips.open(route, tint, poseNow(), clear());
    }
    onWay(state);
  }

  return {
    fitNow,
    isOpen: way.isOpen,
    deep: way.deep,
    running: trips.running,
    moving: () => way.moving() || trips.running(),
    skip: trips.skip,
    tint: () => liveTint(trips.tint(), tint),
    retint() {
      if (fill) tint = fill();
    },
    draw: (view: LatLng) => trips.draw(view),
    advance(now: number, still: boolean) {
      way.advance(now);
      const { pose } = trips.advance(now, still);
      moving = pose ? fitOf(pose, width()) : null;
      return pose;
    },
    open(next: TripRoute, countries: () => TripTint, dom: WayDom, still: boolean) {
      [route, fill, tint] = [next, countries, countries()];
      way.open(next.stops, dom, still);
    },
    close(still: boolean) {
      if (!way.isOpen() || way.moving()) return false;
      way.settle(fitNow(paint.box())!);
      trips.reset();
      [route, fill, tint, moving] = [null, null, null, null];
      return way.close(still);
    },
    goTo(k: number) {
      if (trips.isOpen()) trips.focus(k, poseNow());
    },
    replay() {
      if (!trips.isOpen() || !route || !tint) return;
      face.halt();
      trips.open(route, tint, poseNow(), clear());
    },
    redraw: () => trips.refresh(clear()),
  };
}
