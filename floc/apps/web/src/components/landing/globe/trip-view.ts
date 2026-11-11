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
/** Why: on a wide screen the stop panel covers the map's right and the back button its top; replay (and Back, when narrow) sit along its foot. */
const PANEL = 352;
const BACK = 40;
const FOOT = 48;

/** One borrowed trip on the Borrow globe: the box opens, the route draws in Explore's style, and the way out starts where the map is. */
export function tripView(canvas: HTMLCanvasElement, paint: Painter, face: Face, onWay: (state: "open" | "shut") => void) {
  const way = wayIn(paint, opened);
  // Why: the band's map is small; long names at its edge (Victoria Falls, Swakopmund) need more room than Explore's.
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

  /** Why: the box opens on the way-in clock, then the route takes the camera, as on Explore. */
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
    /** True while the hand should leave the globe alone: the route is moving the camera. */
    running: trips.running,
    moving: () => way.moving() || trips.running(),
    skip: trips.skip,
    tint: () => liveTint(trips.tint(), tint),
    /** The outline arrived after the trip opened: its countries again. */
    retint() {
      if (fill) tint = fill();
    },
    draw: (view: LatLng) => trips.draw(view),
    /** Moves both clocks on; the view the route wants, if it is moving the camera. */
    advance(now: number, still: boolean) {
      way.advance(now);
      const { pose } = trips.advance(now, still);
      moving = pose ? fitOf(pose, width()) : null;
      return pose;
    },
    /** `countries` is read again when the outline arrives. */
    open(next: TripRoute, countries: () => TripTint, dom: WayDom, still: boolean) {
      [route, fill, tint] = [next, countries, countries()];
      way.open(next.stops, dom, still);
    },
    /** False when there is nothing to close or it is still moving. */
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
    /** Draws the route again from the view the map is at. */
    replay() {
      if (!trips.isOpen() || !route || !tint) return;
      face.halt();
      trips.open(route, tint, poseNow(), clear());
    },
    /** New theme or size: the route again for the clear part, and the view it now rests at. */
    redraw: () => trips.refresh(clear()),
  };
}
