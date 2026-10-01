import type { LatLng } from "@/lib/landing/globe/sphere";

type Ink = { pen: string; sheet: string; sea: string; edge: string };
type Brush = {
  ctx: CanvasRenderingContext2D;
  ink: Ink;
  at: (view: LatLng, p: LatLng) => { x: number; y: number; z: number };
};

/** The small marks drawn over the globe: a trip with no tile, the pulse of a pin, a route between stops. */
export function globeMarks({ ctx, ink, at }: Brush) {
  return {
    spot(view: LatLng, p: LatLng) {
      const q = at(view, p);
      if (q.z < 0.05) return;
      ctx.beginPath();
      ctx.arc(q.x, q.y, 2.6, 0, Math.PI * 2);
      ctx.fillStyle = ink.sheet;
      ctx.fill();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = ink.pen;
      ctx.stroke();
    },
    /** A ring that leaves a pin of radius `r` and fades; `beat` runs 0 to 1. */
    pulse(view: LatLng, p: LatLng, r: number, beat: number) {
      const q = at(view, p);
      if (q.z < 0.05) return;
      ctx.save();
      ctx.globalAlpha = 0.5 * (1 - beat);
      ctx.beginPath();
      ctx.arc(q.x, q.y, r + 3 + 10 * (1 - (1 - beat) ** 2), 0, Math.PI * 2);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = ink.pen;
      ctx.stroke();
      ctx.restore();
    },
    /** A solid line along `path` as far as its point `upTo`. */
    line(view: LatLng, path: LatLng[], upTo: number, width: number, tone: keyof Ink, alpha: number) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      let down = false;
      for (const p of path.slice(0, upTo + 1)) {
        const q = at(view, p);
        if (q.z < 0) down = false;
        else if (down) ctx.lineTo(q.x, q.y);
        else {
          ctx.moveTo(q.x, q.y);
          down = true;
        }
      }
      ctx.lineWidth = width;
      ctx.strokeStyle = ink[tone];
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      ctx.restore();
    },
  };
}
