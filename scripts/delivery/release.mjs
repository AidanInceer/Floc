import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { command, git } from "./process.mjs";
import { autoMerge, closedBy, gh, json, pullRequest } from "./github.mjs";
import { mainCheckout } from "../workspace/worktrees.mjs";

const PACKAGE = "floc/apps/web/package.json";
const FEAT = /^(?:\d+\.\d+\.\d+ )?#(?:\d+|no-ticket): feat:/;

const parts = (version) => version.split(".").map(Number);
const newer = (a, b) => { const [x, y] = [parts(a), parts(b)]; return x[0] - y[0] || x[1] - y[1] || x[2] - y[2]; };

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

function versionTree(root, base, version) {
  const pkg = git(root, "show", `${base}:${PACKAGE}`).replace(/"version": "[^"]+"/, `"version": "${version}"`);
  if (pkg === git(root, "show", `${base}:${PACKAGE}`)) return git(root, "rev-parse", `${base}^{tree}`);
  const blob = command("git", ["hash-object", "-w", "--stdin"], { cwd: root, input: `${pkg}\n` });
  const scratch = mkdtempSync(join(tmpdir(), "floc-release-"));
  const env = { ...process.env, GIT_INDEX_FILE: join(scratch, "index") };
  try {
    command("git", ["read-tree", base], { cwd: root, env });
    command("git", ["update-index", "--cacheinfo", `100644,${blob},${PACKAGE}`], { cwd: root, env });
    return command("git", ["write-tree"], { cwd: root, env });
  } finally { rmSync(scratch, { recursive: true, force: true }); }
}

const contains = (root, ancestor, ref) => {
  try { git(root, "merge-base", "--is-ancestor", ancestor, ref); return true; } catch { return false; }
};

export function releaseHead(root, { develop, branch, version }) {
  if (branch && contains(root, develop, branch)) return null;
  const tree = versionTree(root, develop, version);
  if (!branch && tree === git(root, "rev-parse", `${develop}^{tree}`)) return develop;
  const parentArgs = branch ? ["-p", branch, "-p", develop] : ["-p", develop];
  const message = branch ? `#no-ticket: chore: release ${version}, take in develop` : `#no-ticket: chore: release ${version}`;
  return command("git", ["commit-tree", tree, ...parentArgs, "-m", message], { cwd: root });
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
  if (pr) {
    git(main, "fetch", "--quiet", "origin", branch);
    const head = releaseHead(main, { develop, branch: git(main, "rev-parse", "FETCH_HEAD"), version });
    if (head) git(main, "push", "--quiet", "origin", `${head}:refs/heads/${branch}`);
  } else {
    const head = releaseHead(main, { develop, branch: null, version });
    git(main, "push", "--quiet", "origin", `${head}:refs/heads/${branch}`);
    const messages = git(main, "log", "--format=%B", "origin/main..origin/develop");
    const tickets = closedBy(messages).map((n) => ({ number: n, title: json(main, "issue", "view", n, "--json", "title").title }));
    const others = subjects.filter((s) => s.includes("#no-ticket:"));
    const body = join(mkdtempSync(join(tmpdir(), "floc-release-body-")), "body.md");
    writeFileSync(body, releaseBody({ tickets, others, migrations }));
    gh(main, "pr", "create", "--base", "main", "--head", branch, "--title", `Release ${version}`, "--body-file", body);
    pr = pullRequest(main, branch, "open");
  }
  const merging = autoMerge(main, pr.number, "main");
  return {
    state: "release opened", version, pr: pr.url, number: pr.number, migrations, autoMerge: merging,
    next: `Start the floc:ci-watch agent in the background for PR #${pr.number}; once it reports merged, pnpm delivery finish --pr ${pr.number}.`,
  };
}
