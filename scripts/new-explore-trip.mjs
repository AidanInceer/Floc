// Usage: pnpm explore:new <region> <id>   e.g. pnpm explore:new europe lisbon-long-weekend
// Writes listings/<region>/<id>.ts from a template and adds it to that region's list.
// Fill the file in, then run `pnpm --filter @floc/core test explore` — the listing tests check it.
import fs from "node:fs";
import path from "node:path";

const REGIONS = { africa: "Africa", americas: "Americas", asia: "Asia", europe: "Europe", oceania: "Oceania" };
const [region, id] = process.argv.slice(2);

if (!REGIONS[region] || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id ?? "")) {
  console.error(`Usage: pnpm explore:new <${Object.keys(REGIONS).join("|")}> <kebab-case-id>`);
  process.exit(1);
}

const dir = path.join(import.meta.dirname, "../floc/packages/floc-core/src/trip/explore/listings", region);
const file = path.join(dir, `${id}.ts`);
if (fs.existsSync(file)) {
  console.error(`${path.relative(process.cwd(), file)} already exists.`);
  process.exit(1);
}

const name = id.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
fs.writeFileSync(
  file,
  `import { defineTrip } from "../../define-trip";

export const ${name} = defineTrip({
  id: "${id}",
  title: "",
  operator: "Floc editorial",
  editorial: true,
  region: "${REGIONS[region]}",
  country: "",
  groupSize: "2–8 people",
  priceFromMinor: 0,
  currency: "GBP",
  summary: "",
  legs: [
    { kind: "base", place: "", nights: 2, lat: 0, lng: 0 },
    { kind: "hop", place: "", mode: "train", detail: "" },
    { kind: "base", place: "", nights: 2, lat: 0, lng: 0 },
  ],
  highlights: [],
  bestMonths: "",
  interests: [],
  landscape: [],
  effort: "Easy",
});
`,
);

const index = path.join(dir, "index.ts");
const src = fs.readFileSync(index, "utf8").replace(/\r\n/g, "\n");
const withImport = src.replace(/(import \{ \w+ \} from "\.\/[^"]+";\n)(?!import)/, `$1import { ${name} } from "./${id}";\n`);
const withEntry = withImport.replace(/\n\];\n$/, `\n  ${name},\n];\n`);
fs.writeFileSync(index, withEntry);

console.log(`Wrote ${path.relative(process.cwd(), file)} and added it to ${region}/index.ts.`);
