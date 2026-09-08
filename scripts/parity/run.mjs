/**
 * The web/app parity gate (see `floc/packages/floc-api/src/parity.ts`).
 *
 * Runs from the repo root, not through turbo: turbo's CI filter only builds
 * packages the diff touched *plus their dependents*, and a mobile-only change
 * touches neither `@floc/api` nor `floc-web` — exactly the change most likely
 * to move parity. So this is its own always-on job, like the migration check.
 *
 *   pnpm parity            fail on any disagreement
 *   pnpm parity --fix      rewrite parity.json from what the code says
 *
 * `--fix` is for the boring half (a new procedure, a shipped one). It writes
 * `planned` with no `why`, which still fails — the reason is yours to give.
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { diffParity, paritySummary } from "../../floc/packages/floc-api/src/parity.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const routersDir = join(root, "floc/packages/floc-api/src/routers");
const mobileDir = join(root, "floc/apps/mobile");
const manifestPath = join(root, "scripts/parity/parity.json");

/** Every `name: xProcedure` at the top level of a router file, prefixed by the file it lives in. */
function declaredProcedures() {
  const names = [];
  for (const file of readdirSync(routersDir).filter((f) => f.endsWith(".ts") && !f.includes(".test."))) {
    const prefix = file.replace(/\.ts$/, "");
    for (const [, name] of readFileSync(join(routersDir, file), "utf8").matchAll(
      /^ {2}([a-zA-Z]+): (?:protected|trip|public)Procedure/gm,
    )) {
      names.push(`${prefix}.${name}`);
    }
  }
  return names.sort();
}

/** Every `trpc.<router>.<procedure>` the phone app mentions, wherever it mentions it. */
function mobileCalls() {
  const found = new Set();
  const skip = new Set(["node_modules", ".expo", "android", "ios", "dist", "coverage"]);
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!skip.has(entry.name)) walk(join(dir, entry.name));
      } else if (/\.tsx?$/.test(entry.name)) {
        for (const [, name] of readFileSync(join(dir, entry.name), "utf8").matchAll(
          /\btrpc\.([a-zA-Z]+\.[a-zA-Z]+)/g,
        )) {
          found.add(name);
        }
      }
    }
  };
  walk(mobileDir);
  return [...found].sort();
}

const procedures = declaredProcedures();
const calls = mobileCalls();

if (process.argv.includes("--fix")) {
  const old = JSON.parse(readFileSync(manifestPath, "utf8"));
  const next = { procedures: {}, webOnly: old.webOnly };
  for (const name of procedures) {
    const previous = old.procedures[name];
    next.procedures[name] = calls.includes(name)
      ? { mobile: "yes" }
      : { mobile: previous?.mobile === "yes" ? "planned" : (previous?.mobile ?? "planned"), ...(previous?.why ? { why: previous.why } : {}) };
  }
  writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`parity.json rewritten — ${paritySummary(next)}`);
  process.exit(0);
}

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const failures = diffParity(procedures, calls, manifest);

// A web-only entry is a claim about a path; when the path goes, so should the entry.
for (const feature of manifest.webOnly) {
  if (!existsSync(join(root, feature.path))) {
    failures.push(`webOnly "${feature.id}": ${feature.path} no longer exists — remove or repoint it`);
  }
}

if (failures.length === 0) {
  console.log(`✓ web/app parity is declared honestly — ${paritySummary(manifest)}`);
  process.exit(0);
}

console.error(`✗ ${failures.length} parity disagreement(s):`);
for (const failure of failures) console.error(`    ${failure}`);
console.error("\n  fix: edit scripts/parity/parity.json (or `pnpm parity --fix`, then add the reasons)");
process.exit(1);
