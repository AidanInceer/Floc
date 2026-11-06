import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { command, git } from "./process.mjs";
import { closedBy, gh, json, pullRequest } from "./github.mjs";
import { startWatcher } from "./schedule.mjs";
import { mainCheckout } from "../workspace/worktrees.mjs";

const scripts = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE = "floc/apps/web/package.json";
const FEAT = /^(?:\d+\.\d+\.\d+ )?#(?:\d+|no-ticket): feat:/;

const parts = (version) => version.split(".").map(Number);
const newer = (a, b) => { const [x, y] = [parts(a), parts(b)]; return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };

/** One version per release: minor when any change is a feat, else patch. A develop already bumped the old way wins. */
export function nextVersion(live, developVersion, subjects) {
  const [major, minor, patch] = parts(live);
  const next = subjects.some((s) => FEAT.test(s)) ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`;
  return newer(developVersion, next) > 0 ? developVersion : next;
}

export function releaseBody({ tickets, others, migrations }) {
  return [
    "## Tickets", ...(tickets.length ? tickets.map((t) => `- #${t.number} ${t.title}`) : ["- none"]), "",
    "## Other commits", ...(others.length ? others.map((s) => `- ${s}`) : ["- none"]), "",
    "## Checks", `- Schema migrations: ${migrations.length ? migrations.join(", ") : "none"}`, "",
  ].join("\n");
}

// Why plumbing: the release commit only changes the version line, so it needs no worktree, install or hooks.
function versionCommit(root, base, version) {
  const pkg = git(root, "show", `${base}:${PACKAGE}`).replace(/"version": "[^"]+"/, `"version": "${version}"`);
  const blob = command("git", ["hash-object", "-w", "--stdin"], { cwd: root, input: `${pkg}\n` });
  const scratch = mkdtempSync(join(tmpdir(), "floc-release-"));
  const env = { ...process.env, GIT_INDEX_FILE: join(scratch, "index") };
  try {
    command("git", ["read-tree", base], { cwd: root, env });
    command("git", ["update-index", "--cacheinfo", `100644,${blob},${PACKAGE}`], { cwd: root, env });
    const tree = command("git", ["write-tree"], { cwd: root, env });
    return command("git", ["commit-tree", tree, "-p", base, "-m", `#no-ticket: chore: release ${version}`], { cwd: root });
  } finally { rmSync(scratch, { recursive: true, force: true }); }
}

export function release(root, { approveSchema } = {}) {
  const main = mainCheckout(root);
  git(main, "fetch", "--quiet", "origin", "main", "develop");
  const develop = git(main, "rev-parse", "origin/develop");
  const subjects = git(main, "log", "--no-merges", "--format=%s", "origin/main..origin/develop").split("\n").filter(Boolean);
  if (!subjects.length) return { state: "nothing to release" };
  const migrations = git(main, "diff", "--name-only", "origin/main", "origin/develop", "--", "floc/apps/web/drizzle").split("\n").filter(Boolean);
  if (migrations.length && approveSchema !== develop) {
    return { state: "needs approval", migrations, next: `Ask Aidan. After a yes for this exact commit: pnpm delivery release --approve-schema ${develop}` };
  }
  const version = nextVersion(JSON.parse(git(main, "show", `origin/main:${PACKAGE}`)).version, JSON.parse(git(main, "show", `origin/develop:${PACKAGE}`)).version, subjects);
  const branch = `release/${version}`;
  let pr = pullRequest(main, branch, "open");
  if (!pr) {
    const developVersion = JSON.parse(git(main, "show", `origin/develop:${PACKAGE}`)).version;
    const head = developVersion === version ? develop : versionCommit(main, "origin/develop", version);
    git(main, "push", "--quiet", "origin", `${head}:refs/heads/${branch}`);
    const messages = git(main, "log", "--format=%B", "origin/main..origin/develop");
    const tickets = closedBy(messages).map((n) => ({ number: n, title: json(main, "issue", "view", n, "--json", "title").title }));
    const others = subjects.filter((s) => s.includes("#no-ticket:"));
    const body = join(mkdtempSync(join(tmpdir(), "floc-release-body-")), "body.md");
    writeFileSync(body, releaseBody({ tickets, others, migrations }));
    gh(main, "pr", "create", "--base", "main", "--head", branch, "--title", `Release ${version}`, "--body-file", body);
    pr = pullRequest(main, branch, "open");
  }
  let autoMerge = "on";
  try { gh(main, "pr", "merge", String(pr.number), "--auto", "--merge"); }
  catch { autoMerge = "off; the watcher merges once checks pass"; }
  const watcher = startWatcher({ scripts, pr: pr.number, branch, target: "main", main });
  return { state: "release opened", version, pr: pr.url, migrations, autoMerge, watcher: watcher.log };
}
