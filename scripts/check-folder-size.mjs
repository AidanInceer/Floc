/**
 * No folder becomes a wall of files (CLAUDE.md, Code standards).
 *
 * Past about twenty files you can no longer scan a folder and know what is in
 * it, so the fix is feature subfolders — `components/trip/`, `server/money/` —
 * nested as deep as the feature wants. This counts only the files sitting
 * DIRECTLY in a folder, so splitting one always fixes it.
 */
import { readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const MAX = 20;

const SKIP = new Set(["node_modules", ".next", ".expo", ".git", "dist", "build", "coverage"]);

/**
 * 2026-09-10: the four walls the cap was written for are all split. What is
 * left is the one folder a refactor would not repay.
 */
const ALLOWLIST = new Set([
  // Old, don't extend (CLAUDE.md) — a dead app is not worth a refactor.
  "floc/apps/prototype",
]);

const failures = [];
let checked = 0;

function walk(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });
  const posix = relative(ROOT, dir).split(sep).join("/");

  // A prototype subfolder is skipped with its parent, not listed one by one.
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
