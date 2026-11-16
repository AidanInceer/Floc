export const TRAIL_W = 1000;
export const TRAIL_H = 400;

export const PLANE_D =
  "M23 12c0-1-1-1.4-2-1.4h-6L9.5 3h-2l3 7.6H5L3.2 8H1.6l1 4-1 4h1.6L5 13.4h5.5l-3 7.6h2l5.5-7.6h6c1 0 2-.4 2-1.4Z";

const START = { x: -40, y: 300 };
const BEND = { x: 500, y: -40 };
const END = { x: 1040, y: 300 };

export const TRAIL_D = `M${START.x} ${START.y} Q${BEND.x} ${BEND.y} ${END.x} ${END.y}`;

const along = (t: number, a: number, b: number, c: number) => (1 - t) ** 2 * a + 2 * t * (1 - t) * b + t ** 2 * c;
const slope = (t: number, a: number, b: number, c: number) => 2 * (1 - t) * (b - a) + 2 * t * (c - b);

export function flightPoint(t: number, width: number, height: number) {
  const sx = width / TRAIL_W;
  const sy = height / TRAIL_H;
  const dx = slope(t, START.x, BEND.x, END.x) * sx;
  const dy = slope(t, START.y, BEND.y, END.y) * sy;
  return {
    x: along(t, START.x, BEND.x, END.x) * sx,
    y: along(t, START.y, BEND.y, END.y) * sy,
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  };
}
