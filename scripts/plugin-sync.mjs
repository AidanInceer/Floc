#!/usr/bin/env node
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "..");
const manifest = join(repoRoot, "plugins", "floc", ".claude-plugin", "plugin.json");

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const edited = input.tool_input?.file_path;
if (!edited) process.exit(0);

const path = relative(repoRoot, resolve(edited)).replaceAll("\\", "/");
if (!path.startsWith("plugins/floc/") || path.endsWith("plugin.json")) process.exit(0);

const current = JSON.parse(readFileSync(manifest, "utf8"));
let committed = "";
try {
  const head = execFileSync("git", ["show", "HEAD:plugins/floc/.claude-plugin/plugin.json"], { cwd: repoRoot, encoding: "utf8" });
  committed = JSON.parse(head).version;
} catch {}

// Why: bump once per slice, against HEAD — not once per edit.
if (current.version === committed) {
  const [major, minor, patch] = current.version.split(".").map(Number);
  current.version = `${major}.${minor}.${patch + 1}`;
  const eol = readFileSync(manifest, "utf8").includes("\r\n") ? "\r\n" : "\n";
  writeFileSync(manifest, JSON.stringify(current, null, 2).replaceAll("\n", eol) + eol);
}

const update = spawnSync("claude plugin update floc@floc --scope project", { cwd: repoRoot, shell: true, encoding: "utf8" });
const note = update.status === 0 ? "updated" : "update failed — run `claude plugin update floc@floc --scope project`";
console.error(`floc plugin ${current.version} ${note}. Restart the session to load it.`);
