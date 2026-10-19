/**
 * Why: Explore's zoomed globe and outline maps need 1:50m coasts and islands, but its 3 MB GeoJSON is too heavy; `packLand` packs it to ~140 kB gzipped.
 * Run by hand from apps/web after downloading ne_50m_admin_0_countries.geojson (natural-earth-vector, geojson/) next to this file.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { packLand } from "../src/lib/land/pack-land.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "public/land-50m.json");

fs.writeFileSync(out, JSON.stringify(packLand(JSON.parse(fs.readFileSync(path.join(here, "ne_50m_admin_0_countries.geojson"), "utf8")))));
console.log("KB:", Math.round(fs.statSync(out).size / 1024));
