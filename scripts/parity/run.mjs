import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { diffParity, paritySummary } from "../../floc/packages/floc-api/src/parity.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const routersDir = join(root, "floc/packages/floc-api/src/routers");
const mobileDir = join(root, "floc/apps/mobile");
const manifestPath = join(root, "scripts/parity/parity.json");

function declaredProcedures() {
  const names = [];
  for (const file of readdirSync(routersDir, { recursive: true }).filter((f) => f.endsWith(".ts") && !f.includes(".test."))) {
    const prefix = basename(file, ".ts");
    for (const [, name] of readFileSync(join(routersDir, file), "utf8").matchAll(
      /^ {2}([a-zA-Z]+): (?:protected|trip|public)Procedure/gm,
    )) {
      names.push(`${prefix}.${name}`);
    }
  }
  return names.sort();
}

function mobileCalls() {
  const found = new Set();
  const skip = new Set(["node_modules", ".expo", "android", "ios", "dist", "coverage"]);
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (!skip.has(entry.name)) walk(join(dir, entry.name));
      } else if (/\.tsx?$/.test(entry.name)) {
        for (const [, name] of readFileSync(join(dir, entry.name), "utf8").matchAll(
          /\b(?:trpc|client)\.([a-zA-Z]+\.[a-zA-Z]+)/g,
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
