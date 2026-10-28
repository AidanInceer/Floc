import { traceRing } from "@floc/globe/canvas/paint";
import { arc, capOf, project, sightOf, type LatLng } from "@floc/globe/sphere";
import { PLANE_D } from "@/lib/landing/hero/flight-path";

import { globeMarks } from "./paint-marks";

const PLANE_SCALE = 0.92;

type Box = { w: number; h: number };

// Why: zoomed in, most land is off the canvas; skipping it keeps a 1:50m coast cheap on every frame of a zoom.
const caps = new WeakMap<number[][], ReturnType<typeof capOf>>();
function inSight(view: LatLng, ring: number[][], sight: number) {
  let cap = caps.get(ring);
  if (!cap) caps.set(ring, (cap = capOf(ring)));
  return arc(view, cap.centre) <= sight + cap.reach;
}

/** The land that can show on the canvas, with the sphere's middle at (cx, cy): the furthest corner sets how far round it sees. */
function landInSight(view: LatLng, land: number[][][], R: number, [cx, cy]: number[], { clientWidth: w, clientHeight: h }: HTMLCanvasElement) {
  const sight = sightOf(R, Math.hypot(Math.max(Math.abs(cx!), Math.abs(w - cx!)), Math.max(Math.abs(cy!), Math.abs(h - cy!))));
  return land.filter((ring) => inSight(view, ring, sight));
}
/** Where the sphere sits in the canvas. Left out, it fills the canvas; the way in to a trip makes it far larger. */
type Fit = (box: Box) => { R: number; cx: number; cy: number } | undefined;
/** Countries to fill in a region's colour (`tone`, as in `--tone-red`), faded in by `alpha`. */
export type Tint = { rings: ReadonlySet<number[][]>; tone: string; alpha: number };

function readInk(canvas: HTMLCanvasElement, ink: Record<"pen" | "sheet" | "sea" | "edge", string>) {
  const css = getComputedStyle(canvas);
  [ink.pen, ink.sheet, ink.sea, ink.edge] = ["--pen", "--sheet", "--pastel-blue", "--pastel-blue-edge"].map((name) => css.getPropertyValue(name));
}

// Why: Europe's tint is the sea's own blue, so with a trip open the sea greys over, as it is on the outline maps.
function greySea(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, tint: Tint, sea: () => void) {
  ctx.save();
  ctx.globalAlpha = tint.alpha;
  ctx.fillStyle = getComputedStyle(canvas).getPropertyValue("--sheet-3");
  sea();
  ctx.restore();
}

/**
 * The land, through `draw`, which paints one ring: the tinted countries first, then every other ring over them.
 * Why: the outline data draws Western Sahara inside Morocco's own shape as well as on its own, so the tint must
 * stop where the other shape's border is drawn.
 */
function lands(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, rings: number[][][], tint: Tint | undefined, draw: (ring: number[][]) => void) {
  const own = tint ? rings.filter((ring) => tint.rings.has(ring)) : [];
  for (const ring of own) draw(ring);
  if (tint && tint.alpha > 0) {
    ctx.save();
    ctx.globalAlpha = tint.alpha;
    ctx.fillStyle = getComputedStyle(canvas).getPropertyValue(`--tone-${tint.tone}`);
    for (const ring of own) draw(ring);
    ctx.restore();
  }
  for (const ring of rings) if (!tint?.rings.has(ring)) draw(ring);
}

/** Draws the paper globe on a canvas, in the theme's tokens. Each call takes the view to draw from. */
export function globePainter(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const plane = new Path2D(PLANE_D);
  const ink = { pen: "", sheet: "", sea: "", edge: "" };
  let [R, cx, cy] = [0, 0, 0];

  const at = (view: LatLng, p: LatLng) => {
    const q = project(view, p);
    return { x: cx + R * q.x, y: cy - R * q.y, z: q.z };
  };

  function size(fit?: Fit) {
    const [w, h] = [canvas.clientWidth, canvas.clientHeight];
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const [pw, ph] = [Math.round(w * dpr), Math.round(h * dpr)];
    if (canvas.width !== pw || canvas.height !== ph) [canvas.width, canvas.height] = [pw, ph];
    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, w, h);
    const frame = fit?.({ w, h }) ?? { R: Math.min(w, h) / 2 - 2, cx: w / 2, cy: h / 2 };
    [R, cx, cy] = [frame.R, frame.cx, frame.cy];
    readInk(canvas, ink);
  }

  function disc(fill: boolean) {
    ctx!.beginPath();
    ctx!.arc(cx, cy, R, 0, Math.PI * 2);
    if (fill) ctx!.fill();
    else ctx!.stroke();
  }

  function landRing(view: LatLng, ring: number[][]) {
    if (!traceRing(ctx!, { R, cx, cy }, view, ring)) return;
    ctx!.fill();
    ctx!.stroke();
  }

  return {
    ...globeMarks({ ctx, ink, at }),
    radius: () => R,
    box: (): Box => ({ w: canvas.clientWidth, h: canvas.clientHeight }),
    place: at,
    base(view: LatLng, land: number[][][], fit?: Fit, tint?: Tint) {
      size(fit);
      ctx.fillStyle = ink.sea;
      disc(true);
      if (tint && tint.alpha > 0) greySea(ctx, canvas, tint, () => disc(true));
      ctx.fillStyle = ink.sheet;
      ctx.strokeStyle = ink.edge;
      ctx.lineWidth = 0.8;
      lands(ctx, canvas, landInSight(view, land, R, [cx, cy], canvas), tint, (ring) => landRing(view, ring));
      ctx.lineWidth = 1.5;
      disc(false);
    },
    route(view: LatLng, path: LatLng[], shown: number) {
      ctx.setLineDash([5, 6]);
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = ink.pen;
      ctx.lineCap = "round";
      ctx.beginPath();
      let down = false;
      for (const p of path.slice(0, Math.ceil(path.length * shown))) {
        const q = at(view, p);
        if (q.z < 0) down = false;
        else if (down) ctx.lineTo(q.x, q.y);
        else {
          ctx.moveTo(q.x, q.y);
          down = true;
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    },
    pin(view: LatLng, p: LatLng, r: number, active: boolean) {
      const q = at(view, p);
      if (q.z < 0.05) return;
      ctx.beginPath();
      ctx.arc(q.x, q.y, r + 3, 0, Math.PI * 2);
      ctx.fillStyle = ink.sheet;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(q.x, q.y, r, 0, Math.PI * 2);
      ctx.fillStyle = active ? ink.pen : ink.edge;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = ink.pen;
      ctx.stroke();
    },
    /** The plane at the front of the route line; it shrinks and fades into the pin as it lands. */
    plane(view: LatLng, path: LatLng[], shown: number, landing: number) {
      const i = Math.max(1, Math.round((path.length - 1) * shown));
      const [a, b] = [at(view, path[i - 1]!), at(view, path[i]!)];
      if (shown <= 0.01 || landing >= 1 || b.z < 0.05) return;
      const k = PLANE_SCALE * (1 - 0.6 * landing);
      ctx.save();
      ctx.globalAlpha = 1 - landing;
      ctx.translate(b.x, b.y);
      ctx.rotate(Math.atan2(b.y - a.y, b.x - a.x));
      ctx.scale(k, k);
      ctx.translate(-12, -12);
      ctx.lineJoin = "round";
      ctx.lineWidth = 3;
      ctx.strokeStyle = ink.sheet;
      ctx.stroke(plane);
      ctx.fillStyle = ink.pen;
      ctx.fill(plane);
      ctx.restore();
    },
  };
}
