import { easeInOut, easeOut } from "@/lib/landing/globe/flight";

import { glide, type Pose, type Space } from "./glide";

/**
 * One move of the map, on one clock. Why: the camera, the line and the route it leaves all read the same `t`,
 * so they move as one and cannot drift apart.
 * `drawn` is how much of the new route shows, `old` how much of the one it leaves, `passes` when the pen gets to a point.
 */
export type Timeline<C> = {
  ms: number;
  skip: number;
  pose: (t: number) => Pose<C>;
  drawn: (t: number) => number;
  passes: (f: number) => number;
  old: (t: number) => number;
};

/** How much closer than the whole trip the camera rides with the pen. */
const CLOSE = 2.1;
/** The pen's speed, in px a ms at that zoom. */
const PACE = 0.36;
const FLY = { per: 820, least: 1000, most: 2000 };
const DRAW = { least: 2200, most: 5600 };
const BACK_MS = 1300;
// Why: the pen sets off just before the camera lands, so the arrival and the first stroke read as one move.
const LEAD = 0.86;
const RUB = 0.55;
const WINDOW = 0.09;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const sine = (t: number) => (1 - Math.cos(Math.PI * t)) / 2;

/** Where the camera looks while it follows the pen: the pen's point, averaged over a stretch either side so it never jerks. */
export function penLook<C>(space: Space<C>, points: readonly C[], window = WINDOW): (g: number) => C {
  const n = points.length - 1;
  const span = Math.round(n * window);
  const smooth = points.map((_, i) => space.mean(points.slice(Math.max(0, i - span), i + span + 1)));
  return (g) => {
    if (n < 1) return smooth[0]!;
    const x = clamp(g) * n;
    const i = Math.min(n - 1, Math.floor(x));
    return space.mix(smooth[i]!, smooth[i + 1]!, x - i);
  };
}

/**
 * Follow the pen: fly in close to the start, ride along the route as it draws, then ease out to the whole trip.
 * `length` is the route's length in px at `to`; the old route rubs out while the map flies.
 */
export function followPen<C>(space: Space<C>, { from, to, look, length }: { from: Pose<C>; to: Pose<C>; look: (g: number) => C; length: number }): Timeline<C> {
  const near: Pose<C> = { centre: look(0), w: to.w / CLOSE, at: to.at };
  const fly = glide(space, from, near);
  const T1 = clamp(Math.abs(fly.S) * FLY.per, FLY.least, FLY.most);
  const D = clamp((length * CLOSE) / PACE, DRAW.least, DRAW.most);
  const t0 = T1 * LEAD;
  const T2 = t0 + D;
  const back = glide(space, { centre: look(1), w: near.w, at: to.at }, to);
  const drawn = (t: number) => sine(clamp((t - t0) / D));
  const ms = T2 + BACK_MS;
  return {
    ms,
    skip: ms,
    drawn,
    passes: (f) => t0 + (D * Math.acos(1 - 2 * clamp(f))) / Math.PI,
    old: (t) => 1 - easeInOut(clamp(t / (T1 * RUB))),
    pose(t) {
      if (t < T1) return fly.pose(easeInOut(clamp(t / T1)));
      if (t < T2) return { centre: look(drawn(t)), w: near.w, at: to.at };
      return back.pose(easeInOut(clamp((t - T2) / BACK_MS)));
    },
  };
}

/** A plain move with no route to draw, as back out to every trip: the route it leaves fades first. */
export function glideTo<C>(space: Space<C>, from: Pose<C>, to: Pose<C>): Timeline<C> {
  const path = glide(space, from, to);
  const ms = clamp(Math.abs(path.S) * FLY.per, 900, 1800);
  return {
    ms,
    skip: ms,
    pose: (t) => path.pose(easeInOut(clamp(t / ms))),
    drawn: () => 0,
    passes: () => Infinity,
    old: (t) => 1 - easeOut(clamp(t / (ms * 0.35))),
  };
}

const FADE_MS = 300;

/** How far in each mark is at `t`: a stop, a tag or a name fades in over 300 ms once the pen has passed it. */
export function markFade(tl: Pick<Timeline<unknown>, "passes">, t: number): (at: number) => number {
  return (at) => easeOut(clamp((t - tl.passes(at)) / FADE_MS));
}
