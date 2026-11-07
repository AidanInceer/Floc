/**
 * The world as a grid of dots on its land, for a map with no stops yet: a flat (Mercator) world from 72°N to 50°S,
 * centred on Europe and Africa, cropped to fill the box. Pure, so the grid is worked out once per size.
 */
import { onLand, type Piece } from "./land";

export type Dot = { x: number; y: number; lng: number; lat: number };

const RAD = Math.PI / 180;
const mercY = (lat: number) => Math.log(Math.tan(Math.PI / 4 + (lat * RAD) / 2));
const latOf = (y: number) => (2 * Math.atan(Math.exp(y)) - Math.PI / 2) / RAD;
const [TOP, BOTTOM, MIDDLE] = [mercY(72), mercY(-50), 12];

export function worldDots(land: readonly Piece[], w: number, h: number, step: number): Dot[] {
  if (land.length === 0 || w <= 0 || h <= 0) return [];
  // Why: the world is far wider than tall, so a short box shows less of it across rather than squashing it.
  const k = Math.max(w / (2 * Math.PI * 0.86), h / (TOP - BOTTOM));
  const yMid = (TOP + BOTTOM) / 2;
  const dots: Dot[] = [];
  for (let y = step / 2; y < h; y += step) {
    const lat = latOf(yMid - (y - h / 2) / k);
    const row = land.filter((p) => lat >= p.box.south && lat <= p.box.north);
    for (let x = step / 2; x < w; x += step) {
      const lng = MIDDLE + (x - w / 2) / k / RAD;
      const spot = { lat, lng: ((lng + 540) % 360) - 180 };
      if (onLand(row.filter((p) => spot.lng >= p.box.west && spot.lng <= p.box.east), spot)) dots.push({ x, y, ...spot });
    }
  }
  return dots;
}
