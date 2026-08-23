/**
 * A ceiling on the JavaScript every page loads (#212).
 *
 * `next build` prints First Load JS but nothing asserts on it, so growth is
 * only ever noticed by eye. This measures the same thing — the shared root
 * chunks, gzipped, which every route pays before its own code — and fails when
 * an accidental heavyweight import pushes them past the budget.
 *
 * Raise BUDGET_KB deliberately, in the commit that needs it, with a reason.
 */
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const BUDGET_KB = 115;

const next = new URL("../.next/", import.meta.url);
const manifest = JSON.parse(
  readFileSync(fileURLToPath(new URL("build-manifest.json", next)), "utf8"),
);

const sizes = (manifest.rootMainFiles ?? []).map((file) => [
  file,
  gzipSync(readFileSync(fileURLToPath(new URL(file, next)))).length,
]);

if (sizes.length === 0) {
  console.error("No root chunks in .next/build-manifest.json — build first.");
  process.exit(1);
}

const kb = sizes.reduce((a, [, n]) => a + n, 0) / 1024;

if (kb > BUDGET_KB) {
  console.error(
    `Shared First Load JS is ${kb.toFixed(1)} kB gzipped, over the ${BUDGET_KB} kB budget.`,
  );
  for (const [file, size] of sizes.sort((a, b) => b[1] - a[1])) {
    console.error(`  ${(size / 1024).toFixed(1)} kB  ${file}`);
  }
  process.exit(1);
}
console.log(
  `Shared First Load JS: ${kb.toFixed(1)} kB gzipped, of ${BUDGET_KB} kB.`,
);
