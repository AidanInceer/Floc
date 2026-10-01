import { limbRing, project, shortest, type LatLng } from "@/lib/landing/globe/sphere";
import { PLANE_D } from "@/lib/landing/hero/flight-path";

import { globeMarks } from "./paint-marks";

const RAD = Math.PI / 180;
const PLANE_SCALE = 0.92;

type Box = { w: number; h: number };
/** Where the sphere sits in the canvas. Left out, it fills the canvas; the way in to a trip makes it far larger. */
type Fit = (box: Box) => { R: number; cx: number; cy: number } | undefined;

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
    const css = getComputedStyle(canvas);
    ink.pen = css.getPropertyValue("--pen");
    ink.sheet = css.getPropertyValue("--sheet");
    ink.sea = css.getPropertyValue("--pastel-blue");
    ink.edge = css.getPropertyValue("--pastel-blue-edge");
  }

  function disc(fill: boolean) {
    ctx!.beginPath();
    ctx!.arc(cx, cy, R, 0, Math.PI * 2);
    if (fill) ctx!.fill();
    else ctx!.stroke();
  }

  function landRing(view: LatLng, ring: number[][]) {
    const out = limbRing(view, ring);
    if (!out) return;
    ctx!.beginPath();
    out.forEach((q, k) => {
      const p = out[(k + out.length - 1) % out.length]!;
      if ("x" in q) {
        const [x, y] = [cx + R * q.x, cy - R * q.y];
        return k ? ctx!.lineTo(x, y) : ctx!.moveTo(x, y);
      }
      if (k && "a" in p) return ctx!.arc(cx, cy, R, -p.a, -q.a, shortest((q.a - p.a) / RAD) > 0);
      const [x, y] = [cx + R * Math.cos(q.a), cy - R * Math.sin(q.a)];
      return k ? ctx!.lineTo(x, y) : ctx!.moveTo(x, y);
    });
    ctx!.closePath();
    ctx!.fill();
    ctx!.stroke();
  }

  return {
    ...globeMarks({ ctx, ink, at }),
    radius: () => R,
    box: (): Box => ({ w: canvas.clientWidth, h: canvas.clientHeight }),
    place: at,
    base(view: LatLng, land: number[][][], fit?: Fit) {
      size(fit);
      ctx.fillStyle = ink.sea;
      disc(true);
      ctx.fillStyle = ink.sheet;
      ctx.strokeStyle = ink.edge;
      ctx.lineWidth = 0.8;
      for (const ring of land) landRing(view, ring);
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
