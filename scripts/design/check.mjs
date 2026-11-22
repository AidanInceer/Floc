import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { grown, newRules, shrunk } from "./baseline.mjs";
import { findViolations } from "./rules.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const BASELINE = join(ROOT, "scripts/design/baseline.json");

const SCAN = [
  ["floc/apps/web/src", /\.(tsx?|css)$/],
  ["floc/apps/mobile/src", /\.tsx?$/],
  ["floc/apps/mobile/app", /\.tsx?$/],
  ["floc/packages/floc-editor/src", /\.(tsx?|css)$/],
  ["floc/packages/floc-globe/src", /\.(tsx?|css)$/],
  ["scripts/wireframe", /\.css$/],
];

const EXEMPT = [
  { rule: "emoji", path: /notes\/pages\/emoji|db\/seed\// },
  { rule: "radius", path: /opengraph-image/ },
  { rule: "type-size", path: new RegExp("components/(landing|walkthrough)/|wordmark|og-card|opengraph-image|scripts/wireframe/|server/auth/email") },
  { rule: "icon-box", path: new RegExp("components/landing/") },
];

function files(dir, pattern) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === "node_modules" || name.startsWith(".")) return [];
    if (statSync(path).isDirectory()) return files(path, pattern);
    return pattern.test(name) && !/\.test\.|\.spec\./.test(name) ? [path] : [];
  });
}

const counts = {};
const found = [];
for (const [dir, pattern] of SCAN) {
  for (const path of files(join(ROOT, dir), pattern)) {
    const file = relative(ROOT, path).replaceAll("\\", "/");
    for (const v of findViolations(file, readFileSync(path, "utf8"))) {
      if (EXEMPT.some((e) => e.rule === v.rule && e.path.test(file))) continue;
      const key = `${v.rule} ${file}`;
      counts[key] = (counts[key] ?? 0) + 1;
      found.push({ ...v, file, key });
    }
  }
}

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, "utf8")) : null;
const base = process.env.FLOC_CHECK_BASE ?? "origin/develop";

function atBase(path) {
  const shown = spawnSync("git", ["show", `${base}:${path}`], { cwd: ROOT, encoding: "utf8", windowsHide: true });
  return shown.status === 0 ? shown.stdout : null;
}

const fresh = newRules(atBase("scripts/design/rules.mjs"), readFileSync(join(ROOT, "scripts/design/rules.mjs"), "utf8"));

if (process.argv.includes("--write-baseline")) {
  const next = shrunk(baseline, counts, fresh);
  writeFileSync(BASELINE, `${JSON.stringify(next, Object.keys(next).sort(), 2)}\n`);
  console.log(`Design baseline: ${Object.values(next).reduce((a, b) => a + b, 0)} old findings kept. It only shrinks, except a rule new since ${base} seeds its own.`);
  process.exit(0);
}

const baseBaseline = atBase("scripts/design/baseline.json");
if (baseBaseline && baseline) {
  const raised = grown(JSON.parse(baseBaseline), baseline, fresh);
  if (raised.length) {
    console.error(`scripts/design/baseline.json grew against ${base}:`);
    for (const key of raised) console.error(`  ${key}`);
    console.error("Fix the findings and take these entries back out. Only a rule new since the base may seed entries.");
    process.exit(1);
  }
}

const over = Object.keys(counts).filter((key) => counts[key] > (baseline?.[key] ?? 0));
if (over.length) {
  console.error("Design rules (.claude/rules/design.md):");
  for (const v of found.filter((f) => over.includes(f.key))) {
    console.error(`  ${v.file}:${v.line} [${v.rule}] ${v.hint}\n      ${v.text}`);
  }
  console.error("Fix the new findings. Never raise scripts/design/baseline.json.");
  process.exit(1);
}

const shrinkable = Object.keys(baseline ?? {}).filter((key) => (counts[key] ?? 0) < baseline[key]);
const old = Object.values(baseline ?? {}).reduce((a, b) => a + b, 0);
console.log(
  `Design: no new findings (${old} old ones on the baseline).` +
    (shrinkable.length ? ` ${shrinkable.length} baseline entries can shrink: pnpm design:check --write-baseline.` : ""),
);
