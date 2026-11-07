import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isRunning, readWatchers } from "../delivery/watchers.mjs";
import { isPrimary, isScratch, listWorktrees, mainCheckout, worktreesDir } from "./worktrees.mjs";

/**
 * Claude Code SessionStart hook: what a new session must know before it reads
 * AGENTS.md or a skill — is the main checkout current, are the cached skills
 * the repo's, and what else is in flight. It never fails the session.
 */
export function briefLines(f) {
  const lines = [];
  if (f.primary) {
    if (f.branch !== "develop") lines.push(`Main checkout is on ${f.branch ?? "a detached HEAD"}, not develop. Switch it back before building anything.`);
    else if (f.dirty && f.behind) lines.push(`Main checkout has ${f.dirty} changed tracked files and is ${f.behind} commits behind develop, so it cannot update and its AGENTS.md and skills may be stale. Do not build here; the work belongs in a worktree.`);
    else if (f.dirty) lines.push(`Main checkout has ${f.dirty} changed tracked files. They belong in a worktree (pnpm workspace:new <name>), not here.`);
    else if (f.pulled) lines.push(`Main checkout moved forward ${f.pulled} commits to develop.${f.agentsChanged ? " AGENTS.md changed: read it again before acting." : ""}`);
  } else {
    lines.push(`This is worktree ${f.folder} on ${f.branch ?? "a detached HEAD"}${f.behind ? `, ${f.behind} commits behind develop` : ""}. One task here; start another task in its own worktree and session.`);
  }
  if (f.installed && f.repo && f.installed !== f.repo) {
    lines.push(`Cached floc skills are ${f.installed}; the main checkout has ${f.repo}. Run: claude plugin update floc@floc --scope project, then restart the session.`);
  }
  if (f.tasks || f.watchers) lines.push(`In flight: ${f.tasks} task worktrees, ${f.watchers} watchers running. pnpm workspace:list shows each.`);
  return lines;
}

const gitIn = (cwd, ...args) => {
  const result = spawnSync("git", args, { cwd, encoding: "utf8", windowsHide: true, timeout: 15_000 });
  return result.status === 0 ? result.stdout.trim() : null;
};

const count = (text) => (text ? text.split(/\r?\n/).filter(Boolean).length : 0);

function installedVersion(main) {
  const file = join(homedir(), ".claude/plugins/installed_plugins.json");
  if (!existsSync(file)) return null;
  const entries = JSON.parse(readFileSync(file, "utf8")).plugins?.["floc@floc"] ?? [];
  return entries.find((e) => resolve(e.projectPath ?? "").toLowerCase() === resolve(main).toLowerCase())?.version ?? null;
}

function updateMain(main, facts) {
  if (facts.branch !== "develop" || facts.dirty || !facts.behind) return {};
  const before = gitIn(main, "rev-parse", "HEAD");
  if (gitIn(main, "merge", "--ff-only", "--quiet", "origin/develop") === null) return {};
  const changed = gitIn(main, "diff", "--name-only", before, "HEAD") ?? "";
  return { pulled: facts.behind, behind: 0, agentsChanged: /^AGENTS\.md$/m.test(changed) };
}

export function gather(root) {
  const main = mainCheckout(root);
  const primary = isPrimary(root);
  gitIn(root, "fetch", "--quiet", "origin", "develop");
  const facts = {
    primary,
    folder: basename(root),
    branch: gitIn(root, "branch", "--show-current") || null,
    dirty: count(gitIn(root, "--no-optional-locks", "status", "--porcelain", "--untracked-files=no")),
    behind: Number(gitIn(root, "rev-list", "--count", "HEAD..origin/develop") ?? 0),
  };
  if (primary) Object.assign(facts, updateMain(main, facts));
  const pluginFile = join(main, "plugins/floc/.claude-plugin/plugin.json");
  facts.repo = existsSync(pluginFile) ? JSON.parse(readFileSync(pluginFile, "utf8")).version : null;
  facts.installed = installedVersion(main);
  const under = worktreesDir(main).toLowerCase();
  facts.tasks = listWorktrees(main).filter((w) => w.path.toLowerCase().startsWith(under) && !isScratch(w.branch) && !w.branch.startsWith("release")).length;
  facts.watchers = readWatchers(main).filter(isRunning).length;
  return facts;
}

if (process.argv[1] && resolve(process.argv[1]).toLowerCase() === resolve(fileURLToPath(import.meta.url)).toLowerCase()) {
  try {
    const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
    const lines = briefLines(gather(root));
    if (lines.length) console.log(lines.join("\n"));
  } catch (error) {
    console.log(`Session brief unavailable: ${error.message.split("\n")[0]}`);
  }
}
