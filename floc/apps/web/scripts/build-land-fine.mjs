/**
 * Why: Explore's zoomed globe and outline maps need 1:50m coasts and islands, but its 3 MB GeoJSON is too heavy.
 * Outer rings thinned at 0.01° (under a pixel at the closest zoom), packed as steps in hundredths of a degree: ~140 kB gzipped.
 * Run by hand from apps/web after downloading ne_50m_admin_0_countries.geojson (natural-earth-vector, geojson/) next to this file.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(here, "ne_50m_admin_0_countries.geojson");
const OUT = path.join(here, "..", "public/land-50m.json");
const TOLERANCE = 0.01;

// Same folds as build-countries.mjs, so a code means the same shape in both files.
const FOLD = { CYN: "CY", SOL: "SO" };

function codeOf(p) {
  const code = p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : FOLD[p.ADM0_A3];
  return code && code.length === 2 ? code : null;
}

function simplify(points, tolerance) {
  if (points.length < 5) return points;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const spans = [[0, points.length - 1]];
  while (spans.length) {
    const [a, b] = spans.pop();
    const [[ax, ay], [bx, by]] = [points[a], points[b]];
    const [dx, dy] = [bx - ax, by - ay];
    const length = Math.hypot(dx, dy);
    let [far, at] = [-1, -1];
    for (let i = a + 1; i < b; i++) {
      const [px, py] = points[i];
      const d = length ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / length : Math.hypot(px - ax, py - ay);
      if (d > far) [far, at] = [d, i];
    }
    if (far > tolerance) {
      keep[at] = 1;
      spans.push([a, at], [at, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

function pack(ring) {
  const flat = [];
  let [x0, y0] = [0, 0];
  for (const [lng, lat] of simplify(ring, TOLERANCE)) {
    const [x, y] = [Math.round(lng * 100), Math.round(lat * 100)];
    if (flat.length && x === x0 && y === y0) continue;
    flat.push(x - x0, y - y0);
    [x0, y0] = [x, y];
  }
  return flat.length >= 8 ? flat : null;
}

const land = {};
let points = 0;
for (const f of JSON.parse(fs.readFileSync(SRC, "utf8")).features) {
  const code = codeOf(f.properties);
  if (!code) continue;
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const rings = polys.map((poly) => pack(poly[0])).filter(Boolean);
  if (!rings.length) continue;
  land[code] = (land[code] ?? []).concat(rings);
  points += rings.reduce((sum, r) => sum + r.length / 2, 0);
}

fs.writeFileSync(OUT, JSON.stringify(land));
console.log("countries:", Object.keys(land).length, "points:", points);
console.log("KB:", Math.round(fs.statSync(OUT).size / 1024));
