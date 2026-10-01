/**
 * The two rules #206 established by hand, now enforced on every stylesheet
 * under src/ — globals.css and the feature files beside their components.
 *
 * 1. One hex per meaning — colour lives in the `:root` token blocks (light and
 *    dark) and nowhere else, or a palette change silently misses call sites.
 * 2. No class that nothing references — 0.46.0 deleted ~500 lines of CSS
 *    styling nothing, all of it invisible to tsc and eslint.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { CSS_PATH, DARK, rootBlock } from "./tokens.mjs";

const SRC = fileURLToPath(new URL("../src", import.meta.url));

/**
 * Colours a mail client or a third party dictates, which `var()` cannot reach:
 * an email has no stylesheet, and Google prescribes its own button.
 */
const HEX_ALLOWED = [/google/i, /leaflet/i];

/** Classes a third-party library puts on the DOM — Leaflet's, not ours. */
const CLASS_ALLOWED = [/^leaflet-/];

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
    // Selector lines only — a rule opens with { or continues with a comma. This
    // keeps file extensions in url() out of the class list.
    if (!trimmed.endsWith("{") && !trimmed.endsWith(",")) continue;
    for (const [, cls] of trimmed.matchAll(/[.]([a-z][A-Za-z0-9_-]*)/g)) {
      if (!declared.has(cls)) declared.set(cls, name);
    }
  }
}

const source = scripts.map((f) => readFileSync(f, "utf8")).join("\n");
// Every hyphenated word the source mentions, so `day-pill` never counts as a
// use of `day-pill-lg`.
const mentioned = new Set(source.split(/[^\w-]+/));
for (const [cls, file] of declared) {
  if (CLASS_ALLOWED.some((r) => r.test(cls))) continue;
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
