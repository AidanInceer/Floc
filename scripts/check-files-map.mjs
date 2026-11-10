/**
 * Why: floc/FILES.md tells agents where a feature lives. A map that points at a
 * moved folder sends them searching the wrong place, so every path in it must exist.
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const MAP = "floc/FILES.md";
const REPO_PATH = /^(floc|scripts|plugins|\.claude)\/\S*$/;

export function missingPaths(markdown, exists) {
  const paths = [...markdown.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  return [...new Set(paths)]
    .filter((path) => REPO_PATH.test(path))
    .filter((path) => !exists(path));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const missing = missingPaths(readFileSync(join(ROOT, MAP), "utf8"), (path) => existsSync(join(ROOT, path)));
  if (missing.length) {
    console.error(`${MAP} names paths that do not exist — fix the map in the same commit as the move:`);
    for (const path of missing) console.error(`  ${path}`);
    process.exit(1);
  }
  console.log(`Files map: every path in ${MAP} exists.`);
}
