/**
 * Why: catches only the doc drift a machine can see — a table missing from the
 * ERD, a procedure missing from the API map, a link or anchor that points nowhere,
 * a page the sidebar cannot reach. Stale prose is still on the person changing
 * the code (CLAUDE.md, Workflow). Layout rules: docs/process/editing-docs.html.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { docLinks } from "./docs-links.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS = join(ROOT, "docs");
const read = (path) => readFileSync(join(ROOT, path), "utf8");

// Why: Better Auth's own tables; the ERD draws only the `user` anchor.
const AUTH_TABLES = new Set(["session", "account", "verification"]);

// Why: the docs live in the private floc-docs repo, so CI has none. Locally every checkout links to them.
if (!existsSync(join(DOCS, "index.html"))) {
  if (process.env.CI) {
    console.log("Docs: not in CI (they live in the private floc-docs repo); skipped.");
    process.exit(0);
  }
  console.error("Docs are missing: run pnpm workspace:prepare to link this checkout to the floc-docs clone.");
  process.exit(1);
}

const failures = [];

function checkErd() {
  const schema = read("floc/apps/web/src/db/schema.ts");
  const erd = read("docs/engineering/data-model.html");
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
  const page = read("docs/engineering/api.html");
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
    if (["private", "input", "samples", "mockups", "prototypes", "site-audit", "temp"].includes(name)) return [];
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "vendor" ? [] : htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => entry.isDirectory()
    ? markdownFiles(join(dir, entry.name)) : entry.name.endsWith(".md") ? [join(dir, entry.name)] : []);
}

const EXTERNAL =/^(https?:|mailto:|data:|javascript:|#)/;

const AGENT_FILES = [
  "AGENTS.md",
  "learnings.md",
  ".claude/rules/mobile.md",
  ".claude/rules/e2e.md",
  ".claude/rules/api.md",
  ".claude/rules/design.md",
  ".claude/rules/checks.md",
];

function checkTarget(from, href, label) {
  if (!href || EXTERNAL.test(href)) return;
  const target = resolve(dirname(from), decodeURI(href.split(/[?#]/)[0]));
  if (!existsSync(target)) return failures.push(`${label}: broken link "${href}"`);
  const anchor = href.split("#")[1];
  if (anchor && target.endsWith(".html") && !readFileSync(target, "utf8").includes(`id="${anchor}"`)) {
    failures.push(`${label}: no anchor "#${anchor}" in "${href}"`);
  }
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

  for (const file of AGENT_FILES) {
    const path = join(ROOT, file);
    for (const m of readFileSync(path, "utf8").matchAll(/\]\(([^)\s]+)\)/g)) {
      checkTarget(path, m[1], file);
    }
  }

  // Why: a skill names doc pages from the repo root, so a deleted or moved page must fail here, not mislead a session later.
  for (const path of markdownFiles(join(ROOT, "plugins/floc"))) {
    const label = relative(ROOT, path).split(sep).join("/");
    for (const href of docLinks(readFileSync(path, "utf8"))) checkTarget(join(ROOT, "AGENTS.md"), href, label);
  }
  return pages.length;
}

// Why: these folders are working space, deliberately kept out of the sidebar.
const UNINDEXED = ["private/", "mockups/", "design/prototypes/", "input/", "samples/"];

function checkTree() {
  const nav = read("docs/assets/nav.js");
  const ids = new Set([...nav.matchAll(/id: '([^']+)'/g)].map((m) => m[1]));
  const hrefs = new Set([...nav.matchAll(/href: '([^']+)'/g)].map((m) => m[1]));
  for (const m of nav.matchAll(/related: \[([^\]]*)\]/g)) {
    for (const id of m[1].match(/[a-z0-9-]+/g) || []) {
      if (!ids.has(id)) failures.push(`nav.js: related id "${id}" is not a page`);
    }
  }
  const decisions = read("docs/foundation/decisions.html");
  for (const m of nav.matchAll(/adr: \[([^\]]*)\]/g)) {
    for (const n of m[1].match(/\d+/g) || []) {
      if (!decisions.includes(`id="adr-${n.padStart(3, "0")}"`)) failures.push(`nav.js: ADR ${n} is not in the decision log`);
    }
  }
  for (const page of htmlFiles(DOCS)) {
    const path = relative(DOCS, page).split(sep).join("/");
    if (UNINDEXED.some((dir) => path.startsWith(dir))) continue;
    if (!hrefs.has(path)) failures.push(`${path}: not in TREE in nav.js, so the sidebar cannot reach it`);
  }
}

function checkFeaturePages() {
  const product = join(DOCS, "product");
  for (const name of readdirSync(product)) {
    const index = join(product, name, "index.html");
    if (!existsSync(index)) continue;
    if (!readFileSync(index, "utf8").includes(`<h2 id="built-on">`)) {
      failures.push(`product/${name}/index.html: no "Built on" section`);
    }
  }
}

const tables = checkErd();
checkTree();
checkFeaturePages();
const procedures = checkApiMap();
const pages = checkLinks();

if (failures.length) {
  console.error("Docs have drifted from the code:");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log(`Docs: ${tables} tables in the ERD, ${procedures} procedures on the API map, links in ${pages} pages resolve.`);
