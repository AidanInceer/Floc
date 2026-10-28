import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const runtime = "In Codex, read [Codex runtime](../../CODEX.md) before following this workflow.";
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

export function syncPlugin(root, { check = false } = {}) {
  const plugin = join(root, "plugins/floc");
  const source = JSON.parse(readFileSync(join(plugin, ".claude-plugin/plugin.json"), "utf8"));
  const updates = new Map();
  for (const skill of source.skills) {
    if (!/^\.\/skills\/[a-z0-9-]+$/.test(skill)) throw new Error(`Invalid skill path: ${skill}`);
    const path = join(plugin, skill, "SKILL.md");
    const original = readFileSync(path, "utf8");
    const lf = original.replace(/\r\n/g, "\n");
    if (!/^---\n[\s\S]*?\n---\n/.test(lf)) throw new Error(`Missing frontmatter: ${skill}`);
    if (!lf.includes(runtime)) {
      const next = lf.replace(/^(---\n[\s\S]*?\n---\n)/, `$1\n${runtime}\n`);
      updates.set(path, original.includes("\r\n") ? next.replace(/\n/g, "\r\n") : next);
    }
  }
  updates.set(join(plugin, ".codex-plugin/plugin.json"), json({
    name: source.name,
    version: source.version,
    description: source.description,
    author: source.author,
    skills: source.skills,
    interface: { displayName: "Floc", shortDescription: "Floc development workflows", developerName: source.author.name },
  }));
  updates.set(join(root, ".agents/plugins/marketplace.json"), json({
    name: "floc",
    plugins: [{
      name: source.name,
      source: { source: "local", path: "./plugins/floc" },
      policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" },
      category: "Productivity",
    }],
  }));
  const changed = [...updates].filter(([path, next]) => !existsSync(path) || readFileSync(path, "utf8").replace(/\r\n/g, "\n") !== next.replace(/\r\n/g, "\n"));
  if (check && changed.length) throw new Error(`Floc plugin out of sync: ${changed.map(([path]) => path).join(", ")}. Run pnpm plugins:sync.`);
  for (const [path, content] of changed) {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  return changed.map(([path]) => path);
}

function fingerprint(directory, hash = createHash("sha256")) {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    hash.update(entry.name);
    const path = join(directory, entry.name);
    if (entry.isDirectory()) fingerprint(path, hash);
    else hash.update(readFileSync(path));
  }
  return hash;
}

export function scopeCodexPlugin(configPath) {
  const original = readFileSync(configPath, "utf8");
  const next = original.replace(/(\[plugins\."floc@floc"\]\s*\r?\nenabled\s*=\s*)true\b/, "$1false");
  if (next !== original) writeFileSync(configPath, next);
}

function refreshClients(root, { force = false } = {}) {
  const digest = fingerprint(join(root, "plugins/floc")).digest("hex");
  const key = createHash("sha256").update(root).digest("hex").slice(0, 16);
  const stamp = join(tmpdir(), `floc-plugin-${key}.json`);
  if (!force && existsSync(stamp) && readFileSync(stamp, "utf8") === digest) return;
  const clients = [
    ["claude", ["plugin", "update", "floc@floc", "--scope", "project"]],
    ["codex", ["plugin", "marketplace", "add", root, "--json"]],
    ["codex", ["plugin", "add", "floc@floc", "--json"]],
  ];
  let refreshed = 0;
  for (const [command, args] of clients) {
    const executable = process.platform === "win32" ? `${command}.exe` : command;
    const result = spawnSync(executable, args, { cwd: root, encoding: "utf8", timeout: 60_000, windowsHide: true });
    if (result.error?.code === "ENOENT") continue;
    if (result.error || result.status !== 0) throw new Error(`${command} plugin refresh failed: ${result.error?.message ?? result.stderr ?? result.stdout}`);
    if (command === "codex" && args[1] === "add") {
      scopeCodexPlugin(join(process.env.CODEX_HOME ?? join(homedir(), ".codex"), "config.toml"));
    }
    console.log(`${command}: ${args[1] === "marketplace" ? "Floc marketplace registered" : "Floc plugin refreshed"}`);
    refreshed++;
  }
  if (refreshed) writeFileSync(stamp, digest);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
    const check = process.argv.includes("--check");
    const changed = syncPlugin(root, { check });
    if (changed.length) console.log(`Floc plugin: synced ${changed.length} file(s)`);
    if (!check && (process.argv.includes("--refresh") || process.argv.includes("--hook"))) {
      refreshClients(root, { force: process.argv.includes("--force") });
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
