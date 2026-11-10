import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runAll } from "./parallel.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// Why no self-tests here: each checker's own tests run in tool-tests, and only when scripts/ changes.
// Why --without: pre-commit runs the docs step on its own, only when the commit touches what it reads.
const without = process.argv.includes("--without") ? process.argv[process.argv.indexOf("--without") + 1].split(",") : [];
const ok = await runAll([
  ["plugin in step", ["node", "scripts/sync-floc-plugin.mjs", "--check"]],
  ["folder size", ["node", "scripts/check-folder-size.mjs"]],
  ["docs", ["node", "scripts/check-docs.mjs"]],
  ["files map", ["node", "scripts/check-files-map.mjs"]],
  ["design rules", ["node", "scripts/design/check.mjs"]],
  ["web and app parity", ["node", "--experimental-strip-types", "scripts/parity/run.mjs"]],
].filter(([label]) => !without.includes(label)), root);
if (!ok) process.exitCode = 1;
