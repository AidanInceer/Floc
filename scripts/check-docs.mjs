/**
 * Why: catches only the doc drift a machine can see — a table missing from the
 * ERD, a procedure missing from the API map, a link that points nowhere. Stale
 * prose is still on the person changing the code (CLAUDE.md, Workflow).
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = join(ROOT, "docs");
const read = (path) => readFileSync(join(ROOT, path), "utf8");

// Why: Better Auth's own tables; the ERD draws only the `user` anchor.
const AUTH_TABLES = new Set(["session", "account", "verification"]);

// Why: docs/ is gitignored, so a fresh checkout (CI) has nothing to check.
if (!existsSync(DOCS)) {
  console.log("Docs: no docs/ folder here — skipped.");
  process.exit(0);
}

const failures = [];

function checkErd() {
  const schema = read("floc/apps/web/src/db/schema.ts");
  const erd = read("docs/architecture/data-model/erd.html");
  const tables = [...schema.matchAll(/Table\(\s*"([a-z_]+)"/g)].map((m) => m[1]);
  for (const table of tables) {
    if (AUTH_TABLES.has(table)) continue;
    if (!new RegExp(`\\b${table.toUpperCase()}\\b`).test(erd)) {
      failures.push(`erd.html: table "${table}" is in schema.ts but not in the diagram`);
    }
  }
  return tables.length;
}

function checkApiMap() {
  const { procedures } = JSON.parse(read("scripts/parity/parity.json"));
  const page = read("docs/architecture/api.html");
  const names = Object.keys(procedures);
  for (const name of names) {
    if (!page.includes(`<code>${name}</code>`)) {
      failures.push(`api.html: procedure "${name}" is in parity.json but not on the page`);
    }
  }
  return names.length;
}

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "vendor" ? [] : htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

const EXTERNAL = /^(https?:|mailto:|data:|javascript:|#)/;

function checkTarget(from, href, label) {
  if (!href || EXTERNAL.test(href)) return;
  const target = resolve(dirname(from), decodeURI(href.split(/[?#]/)[0]));
  if (!existsSync(target)) failures.push(`${label}: broken link "${href}"`);
}

function checkLinks() {
  const pages = htmlFiles(DOCS);
  for (const page of pages) {
    const label = relative(ROOT, page).split(sep).join("/");
    for (const m of readFileSync(page, "utf8").matchAll(/(?:href|src)="([^"]*)"/g)) {
      checkTarget(page, m[1], label);
    }
  }

  const nav = read("docs/assets/nav.js");
  for (const m of nav.matchAll(/href: '([^']+)'/g)) {
    if (!existsSync(join(DOCS, m[1]))) failures.push(`nav.js: TREE points at missing "${m[1]}"`);
  }

  const claude = join(ROOT, "CLAUDE.md");
  for (const m of readFileSync(claude, "utf8").matchAll(/\]\(([^)\s]+)\)/g)) {
    checkTarget(claude, m[1], "CLAUDE.md");
  }
  return pages.length;
}

const tables = checkErd();
const procedures = checkApiMap();
const pages = checkLinks();

if (failures.length) {
  console.error("Docs have drifted from the code:");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`Docs: ${tables} tables in the ERD, ${procedures} procedures on the API map, links in ${pages} pages resolve.`);
