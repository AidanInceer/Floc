export const TRAIL_W = 1000;
export const TRAIL_H = 400;

// One quadratic curve, in the trail's viewBox units. It runs past both edges so the plane starts and ends off screen.
const START = { x: -40, y: 300 };
const BEND = { x: 500, y: -40 };
const END = { x: 1040, y: 300 };

export const TRAIL_D = `M${START.x} ${START.y} Q${BEND.x} ${BEND.y} ${END.x} ${END.y}`;

const along = (t: number, a: number, b: number, c: number) => (1 - t) ** 2 * a + 2 * t * (1 - t) * b + t ** 2 * c;
const slope = (t: number, a: number, b: number, c: number) => 2 * (1 - t) * (b - a) + 2 * t * (c - b);

/** Where the plane is, in px of a box `width` × `height`, at `t` (0–1) of the flight, and its heading in degrees. */
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
