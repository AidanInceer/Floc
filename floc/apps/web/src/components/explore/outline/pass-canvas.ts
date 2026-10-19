import { paintRoute } from "@/components/explore/route/paint-route";
import { readInk } from "@/components/explore/route/route-ink";
import { nameRoute, tagWidth } from "@/components/explore/route/route-names";
import { followPen, penLook } from "@/lib/explore/route/follow-pen";
import { plane, type Pose } from "@/lib/explore/route/glide";
import { penPoints, routeShape } from "@/lib/explore/route/route-shape";
import type { TripRoute } from "@/lib/explore/route/trip-route";
import { easeOut } from "@/lib/landing/globe/flight";

import type { Frame, Size } from "./frame";

type Point = { x: number; y: number };
/** The land as the outline drawing cut it, in the drawing's px. */
type Land = { home: string; other: string; islets: (Point & { r: number })[] };
type Scene = { route: TripRoute; land: Land; frame: Frame; box: Size; tone: string; moving: boolean };

const FADE_MS = 300;
const clamp = (v: number) => Math.min(1, Math.max(0, v));

/**
 * The pass's map on a canvas: the outline drawing, with the route in Explore's map style. A new pick plays the globe's move
 * on the drawing: in close to the start, along with the pen, back out to the whole trip. Returns a stop function.
 */
export function passCanvas(canvas: HTMLCanvasElement, { route, land, frame, box, tone, moving }: Scene) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const ink = readInk(canvas);
  const width = tagWidth(ctx, ink);
  const shape = routeShape(route, frame.point, { samples: 36, loop: 30, least: 54, tagWidth: width });
  const names = nameRoute(ctx, shape, ink, { left: 6, top: 6, right: box.width - 6, bottom: box.height - 6 });
  const whole: Pose<Point> = { centre: { x: box.width / 2, y: box.height / 2 }, w: box.width, at: { x: box.width / 2, y: box.height / 2 } };
  const length = shape.pieces.reduce((sum, p) => sum + p.len, 0);
  const tl = followPen(plane, { from: whole, to: whole, look: penLook(plane, penPoints(shape, 160)), length });
  const paths = { home: new Path2D(land.home), other: new Path2D(land.other) };
  const css = getComputedStyle(canvas);
  const colour = (name: string) => css.getPropertyValue(`--${name}`);
  const t0 = performance.now();
  let raf = 0;

  function draw(t: number) {
    const dpr = Math.min(2, devicePixelRatio || 1);
    const s = canvas.clientWidth / box.width;
    const [pw, ph] = [Math.round(canvas.clientWidth * dpr), Math.round(canvas.clientHeight * dpr)];
    if (canvas.width !== pw || canvas.height !== ph) [canvas.width, canvas.height] = [pw, ph];
    ctx!.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
    ctx!.clearRect(0, 0, box.width, box.height);
    const pose = tl.pose(t);
    const k = box.width / pose.w;
    const move = (p: Point) => ({ x: pose.at.x + (p.x - pose.centre.x) * k, y: pose.at.y + (p.y - pose.centre.y) * k });
    ctx!.save();
    ctx!.translate(pose.at.x - pose.centre.x * k, pose.at.y - pose.centre.y * k);
    ctx!.scale(k, k);
    ctx!.lineWidth = 0.75 / k;
    // Why: the trip's countries go under the rest, so where two shapes overlap (Morocco and Western Sahara) the drawn border wins.
    ctx!.fillStyle = colour(`tone-${tone}`);
    ctx!.fill(paths.home);
    ctx!.fillStyle = colour("sheet-3");
    ctx!.strokeStyle = colour("rule-2");
    ctx!.fill(paths.other);
    ctx!.stroke(paths.other);
    ctx!.fillStyle = colour(`tone-${tone}`);
    for (const islet of land.islets) {
      ctx!.beginPath();
      ctx!.arc(islet.x, islet.y, islet.r, 0, Math.PI * 2);
      ctx!.fill();
    }
    ctx!.restore();
    const seen = (at: number) => easeOut(clamp((t - tl.passes(at)) / FADE_MS));
    paintRoute(ctx!, shape, { pieces: shape.pieces.map((p) => p.px.map(move)), stops: shape.stops.map((st) => move(st.px)), drawn: tl.drawn(t), seen, alpha: 1 }, ink, names, width);
  }

  function step(now: number) {
    const t = Math.min(tl.ms, now - t0);
    draw(t);
    if (t < tl.ms) raf = requestAnimationFrame(step);
  }

  const skip = () => draw(tl.ms);
  if (moving) {
    raf = requestAnimationFrame(step);
    canvas.addEventListener("click", stopAndSkip);
  } else skip();

  function stopAndSkip() {
    cancelAnimationFrame(raf);
    skip();
  }

  return () => {
    cancelAnimationFrame(raf);
    canvas.removeEventListener("click", stopAndSkip);
  };
}
