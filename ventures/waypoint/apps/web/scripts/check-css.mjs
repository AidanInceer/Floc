/**
 * The two rules #206 established by hand, now enforced.
 *
 * 1. One hex per meaning — colour lives in the `:root` token blocks (light and
 *    dark) and nowhere else, or a palette change silently misses call sites.
 * 2. No class that nothing references — 0.46.0 deleted ~500 lines of CSS
 *    styling nothing, all of it invisible to tsc and eslint.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { CSS_PATH, DARK, readCss, rootBlock } from "./tokens.mjs";

const SRC = fileURLToPath(new URL("../src", import.meta.url));

/**
 * Colours a mail client or a third party dictates, which `var()` cannot reach:
 * an email has no stylesheet, and Google prescribes its own button.
 */
const HEX_ALLOWED = [/google/i, /leaflet/i];

/** Classes a third-party library puts on the DOM — Leaflet's and BlockNote's, not ours. */
const CLASS_ALLOWED = [/^leaflet-/, /^bn-/];

const css = readCss();
const { start, end } = rootBlock(css);
const dark = rootBlock(css, DARK);
const failures = [];

const inATokenBlock = (offset) =>
  (offset > start && offset < end) || (offset > dark.start && offset < dark.end);

// ---------------------------------------------------------------- 1. hexes

css.split("\n").forEach((line, i) => {
  const offset = css.split("\n").slice(0, i).join("\n").length;
  if (inATokenBlock(offset)) return;
  if (!/#[0-9a-f]{3,8}\b/i.test(line)) return;
  if (/^\s*(\*|\/\*|\/\/)/.test(line)) return;
  if (HEX_ALLOWED.some((r) => r.test(line))) return;
  failures.push(
    `globals.css:${i + 1} has a hex literal outside the token block: ${line.trim()}`,
  );
});

// -------------------------------------------------------- 2. dead classes

const declared = new Set();
for (const line of css.slice(end).split("\n")) {
  const trimmed = line.trim();
  // Selector lines only — a rule opens with { or continues with a comma. This
  // keeps file extensions in url() out of the class list.
  if (!trimmed.endsWith('{') && !trimmed.endsWith(',')) continue;
  for (const [, name] of trimmed.matchAll(/[.]([a-z][A-Za-z0-9_-]*)/g)) {
    declared.add(name);
  }
}

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.(tsx?|css)$/.test(entry) && path !== CSS_PATH) files.push(path);
  }
})(SRC);

const source = files.map((f) => readFileSync(f, "utf8")).join("\n");
// Every hyphenated word the source mentions, so `day-pill` never counts as a
// use of `day-pill-lg`.
const mentioned = new Set(source.split(/[^\w-]+/));
for (const name of declared) {
  if (CLASS_ALLOWED.some((r) => r.test(name))) continue;
  if (!mentioned.has(name)) {
    failures.push(`globals.css declares .${name}, which nothing references`);
  }
}

if (failures.length) {
  console.error("globals.css:");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(
  `globals.css: no stray hexes, and all ${declared.size} classes are used.`,
);
