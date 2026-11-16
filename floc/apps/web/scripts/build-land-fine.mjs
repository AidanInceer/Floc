import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { packLand } from "../src/lib/land/pack-land.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "public/land-50m.json");

fs.writeFileSync(out, JSON.stringify(packLand(JSON.parse(fs.readFileSync(path.join(here, "ne_50m_admin_0_countries.geojson"), "utf8")))));
console.log("KB:", Math.round(fs.statSync(out).size / 1024));
