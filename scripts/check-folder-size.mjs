import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const MAX = 20;

const SKIP = new Set(["node_modules", ".next", ".next-verify", ".expo", ".git", "dist", "build", "coverage"]);

const ALLOWLIST = new Set([
  "floc/apps/prototype",
]);

const failures = [];
let checked = 0;

function walk(dir) {
  const posix = relative(ROOT, dir).split(sep).join("/");
  if (posix === "floc/wireframe") return;
  const entries = readdirSync(dir, { withFileTypes: true });

  if (posix && [...ALLOWLIST].some((a) => posix === a || posix.startsWith(`${a}/`))) {
    if (posix === "floc/apps/prototype") return;
  }

  const files = entries.filter((e) => e.isFile() && /\.tsx?$/.test(e.name)).length;
  checked += 1;
  if (files > MAX && !ALLOWLIST.has(posix)) {
    failures.push(`${posix} holds ${files} flat .ts/.tsx files (max ${MAX})`);
  }

  for (const entry of entries) {
    if (entry.isDirectory() && !SKIP.has(entry.name)) walk(join(dir, entry.name));
  }
}

walk(ROOT);

if (failures.length) {
  console.error("Folders past the file cap — split them into feature subfolders:");
  for (const f of failures) console.error(`  ${f}`);
  console.error(`\n  e.g. components/trip/trip-card.tsx, server/money/split.ts — nest as deep as helps.`);
  process.exit(1);
}
console.log(`Folder size: ${checked} folders, none past ${MAX} flat .ts/.tsx files.`);
