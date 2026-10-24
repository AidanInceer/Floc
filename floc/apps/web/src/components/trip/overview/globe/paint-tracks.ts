import type { GroupRoute } from "@floc/api/port";

import type { RouteFraming } from "@/lib/explore/route/fit-route";

type Px = { x: number; y: number };
export type Track = { tone: string; line: Px[]; dot: Px | null };

/** Each member's route in px, and their live dot when there is one (#329). */
export function placeTracks(routes: GroupRoute[], at: RouteFraming["at"]): Track[] {
  return routes.map((r) => ({
    tone: r.tone,
    line: r.path.map(([lng, lat]) => at({ lat, lng })),
    dot: r.live ? at(r.live) : null,
  }));
}

/** Drawn over the planned route: solid, in each person's own ink, so a member's route reads as theirs. */
export function paintTracks(ctx: CanvasRenderingContext2D, tracks: Track[], inkOf: (tone: string) => string, sheet: string) {
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([]);
  for (const t of tracks) {
    if (t.line.length < 2) continue;
    ctx.strokeStyle = inkOf(t.tone);
    ctx.lineWidth = 2.4;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    t.line.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  for (const t of tracks) {
    if (!t.dot) continue;
    ctx.beginPath();
    ctx.arc(t.dot.x, t.dot.y, 6.5, 0, Math.PI * 2);
    ctx.fillStyle = sheet;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(t.dot.x, t.dot.y, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = inkOf(t.tone);
    ctx.fill();
  }
  ctx.restore();
}
