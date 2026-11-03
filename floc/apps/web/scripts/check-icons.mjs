/**
 * Why: icons were spread over 14 files, and agents spent several searches
 * finding one. Every exported `…Icon` or `…Glyph` component now lives in
 * components/system/icons/, one file per area.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("../src", import.meta.url));
const HOME = "components/system/icons/";
const EXPORT = /export\s+(?:function|const)\s+([A-Z]\w*(?:Icon|Glyph))\b/g;

const failures = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) walk(path);
    else if (/\.tsx?$/.test(entry) && !entry.includes(".test.")) {
      const name = relative(SRC, path).replaceAll("\\", "/");
      if (name.startsWith(HOME)) continue;
      for (const [, icon] of readFileSync(path, "utf8").matchAll(EXPORT)) failures.push(`${name}: ${icon}`);
    }
  }
})(SRC);

if (failures.length) {
  console.error(`Icons live in src/${HOME} — move these there:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`Icons: every exported icon is in src/${HOME}.`);
