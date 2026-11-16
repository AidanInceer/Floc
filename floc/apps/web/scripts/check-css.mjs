import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { CSS_PATH, DARK, rootBlock } from "./tokens.mjs";

const SRC = fileURLToPath(new URL("../src", import.meta.url));

const HEX_ALLOWED = [/google/i];

const stylesheets = [];
const scripts = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (entry.endsWith(".css")) stylesheets.push(path);
    else if (/\.tsx?$/.test(entry)) scripts.push(path);
  }
})(SRC);

const failures = [];
const declared = new Map();

for (const path of stylesheets) {
  const css = readFileSync(path, "utf8");
  const name = relative(SRC, path).replaceAll("\\", "/");
  const isGlobals = path === CSS_PATH;
  const light = isGlobals ? rootBlock(css) : { start: -1, end: -1 };
  const dark = isGlobals ? rootBlock(css, DARK) : { start: -1, end: -1 };
  const inATokenBlock = (offset) =>
    (offset > light.start && offset < light.end) || (offset > dark.start && offset < dark.end);

  let offset = 0;
  css.split("\n").forEach((line, i) => {
    const at = offset;
    offset += line.length + 1;
    if (inATokenBlock(at)) return;
    if (!/#[0-9a-f]{3,8}\b/i.test(line)) return;
    if (/^\s*(\*|\/\*|\/\/)/.test(line)) return;
    if (HEX_ALLOWED.some((r) => r.test(line))) return;
    failures.push(`${name}:${i + 1} has a hex literal outside the token block: ${line.trim()}`);
  });

  for (const line of css.slice(Math.max(light.end, 0)).split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.endsWith("{") && !trimmed.endsWith(",")) continue;
    for (const [, cls] of trimmed.matchAll(/[.]([a-z][A-Za-z0-9_-]*)/g)) {
      if (!declared.has(cls)) declared.set(cls, name);
    }
  }
}

const source = scripts.map((f) => readFileSync(f, "utf8")).join("\n");
const mentioned = new Set(source.split(/[^\w-]+/));
for (const [cls, file] of declared) {
  if (!mentioned.has(cls)) failures.push(`${file} declares .${cls}, which nothing references`);
}

if (failures.length) {
  console.error("CSS:");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(
  `CSS: ${stylesheets.length} stylesheets, no stray hexes, and all ${declared.size} classes are used.`,
);
