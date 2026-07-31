/**
 * Regenerates the travel map's two country files (ticket 95) from Natural
 * Earth admin-0 — public domain, no attribution required, no tile host.
 *
 * Not part of the build: it runs by hand when the world changes, which is
 * roughly never. Download the two sources next to this script first:
 *
 *   curl -sSLO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson
 *   curl -sSLO https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson
 *
 * then `node scripts/build-countries.mjs` from apps/web. The GeoJSON and
 * `src/lib/countries.ts` are written together on purpose — a code with no
 * shape, or a shape with no name, is what breaks the map.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.join(here, "..");

const SRC = path.join(here, "ne_110m_admin_0_countries.geojson");
/** Only for the countries 1:110m is too coarse to contain at all — see below. */
const SRC_FINE = path.join(here, "ne_50m_admin_0_countries.geojson");
const OUT_GEO = path.join(app, "public/countries-110m.geojson");
const OUT_TS = path.join(app, "src/lib/countries.ts");

// Natural Earth codes these two as "-99" — no ISO code, because their status is
// disputed. Folding each into the state it is internationally recognised as
// part of keeps the map whole (a blank hole inside Cyprus reads as a bug) and
// keeps Waypoint out of making a territorial claim in a UI fill.
const FOLD = { CYN: "CY", SOL: "SO" };

const round = (n) => Math.round(n * 100) / 100;

function thinRing(ring) {
  const out = [];
  for (const [x, y] of ring) {
    const p = [round(x), round(y)];
    const last = out[out.length - 1];
    if (last && last[0] === p[0] && last[1] === p[1]) continue;
    out.push(p);
  }
  // A ring needs 4 positions (first === last). Rounding can collapse a tiny
  // island below that — drop it rather than emit invalid GeoJSON.
  if (out.length < 4) return null;
  const [fx, fy] = out[0];
  const [lx, ly] = out[out.length - 1];
  if (fx !== lx || fy !== ly) out.push([fx, fy]);
  return out.length >= 4 ? out : null;
}

function thinPolygon(poly) {
  const rings = poly.map(thinRing).filter(Boolean);
  return rings.length ? rings : null;
}

function codeOf(p) {
  const code = p.ISO_A2_EH !== "-99" ? p.ISO_A2_EH : FOLD[p.ADM0_A3];
  return code && code.length === 2 ? code : null;
}

const byCode = new Map();
const names = new Map();

for (const f of JSON.parse(fs.readFileSync(SRC, "utf8")).features) {
  const p = f.properties;
  const code = codeOf(p);
  if (!code) continue;

  const polys =
    f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  const thinned = polys.map(thinPolygon).filter(Boolean);
  if (!thinned.length) continue;

  byCode.set(code, (byCode.get(code) ?? []).concat(thinned));
  if (!FOLD[p.ADM0_A3]) names.set(code, p.NAME_EN || p.NAME);
}

/*
 * 1:110m has no shape at all for the small states — Singapore, Malta, Monaco,
 * Bahrain and ~60 others simply aren't in the file, and Singapore is far too
 * common a destination to be unmarkable. Dropping to 1:50m for everything
 * costs 1.4MB for shapes nobody can see at world zoom, so those countries come
 * in as a **Point** instead, drawn as a small circle: an atlas does the same
 * with a city-state, and a dot you can click beats a country that isn't there.
 * `LABEL_X/Y` is Natural Earth's own hand-placed label anchor.
 */
let dots = 0;
for (const f of JSON.parse(fs.readFileSync(SRC_FINE, "utf8")).features) {
  const p = f.properties;
  const code = codeOf(p);
  if (!code || byCode.has(code) || FOLD[p.ADM0_A3]) continue;
  if (typeof p.LABEL_X !== "number" || typeof p.LABEL_Y !== "number") continue;
  byCode.set(code, [round(p.LABEL_X), round(p.LABEL_Y)]);
  names.set(code, p.NAME_EN || p.NAME);
  dots += 1;
}

const features = [...byCode.entries()]
  .sort((a, b) => a[0].localeCompare(b[0]))
  .map(([code, geom]) => {
    const point = typeof geom[0] === "number";
    return {
      type: "Feature",
      id: code,
      properties: {},
      geometry: point
        ? { type: "Point", coordinates: geom }
        : geom.length === 1
          ? { type: "Polygon", coordinates: geom[0] }
          : { type: "MultiPolygon", coordinates: geom },
    };
  });

fs.writeFileSync(OUT_GEO, JSON.stringify({ type: "FeatureCollection", features }));

const entries = [...names.entries()].sort((a, b) => a[1].localeCompare(b[1]));
const body = entries.map(([code, name]) => `  ${code}: ${JSON.stringify(name)},`).join("\n");

fs.writeFileSync(
  OUT_TS,
  `/**
 * The country vocabulary the travel map speaks (ticket 95).
 *
 * Generated from Natural Earth admin-0 (public domain) — the same source as
 * \`public/countries-110m.geojson\`, so a code here always has a shape to fill
 * and every shape has a name in the list. Regenerating one without the other is
 * what would break them apart; they ship together.
 *
 * Keys are ISO 3166-1 alpha-2, upper case, which is what \`place.country_code\`
 * stores (Nominatim returns them lower case; the writer upper-cases).
 */
export const COUNTRY_NAMES: Record<string, string> = {
${body}
};

/** Alphabetical by name — the order the type-to-filter list renders in. */
export const COUNTRIES: { code: string; name: string }[] = Object.entries(
  COUNTRY_NAMES,
)
  .map(([code, name]) => ({ code, name }))
  .sort((a, b) => a.name.localeCompare(b.name));

/**
 * A code we can draw and name, or \`null\`. The only way in from stored data:
 * \`place.country_code\` is written from whatever Nominatim returned, so a code
 * outside this vocabulary must fall out of the map rather than paint nothing.
 */
export function readCountryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return code in COUNTRY_NAMES ? code : null;
}

/** Name for a code, falling back to the code itself rather than to nothing. */
export function countryName(code: string): string {
  return COUNTRY_NAMES[code] ?? code;
}
`,
);

console.log("countries:", entries.length, "of which dots:", dots);
console.log("geojson KB:", Math.round(fs.statSync(OUT_GEO).size / 1024));
