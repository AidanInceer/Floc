import { renameSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { git } from "../delivery/process.mjs";
import { stopServers } from "./servers.mjs";
import { removeDocs } from "./docs-link.mjs";

export const TASK_BRANCH = /^(feature|fix|chore|hotfix|release)\/[a-z0-9][a-z0-9._-]*$/;

export function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

export function branchFor(name) {
  if (TASK_BRANCH.test(name)) return name;
  const slug = slugify(name);
  if (!slug) throw new Error("Name the work, for example: pnpm workspace:new trip-notes");
  return `feature/${slug}`;
}

const kindOf = (branch) => branch.split("/")[0];
export const baseFor = (branch) => (kindOf(branch) === "hotfix" ? "main" : "develop");
export const targetFor = (branch) => (["hotfix", "release"].includes(kindOf(branch)) ? "main" : "develop");

export function folderFor(branch) {
  const kind = kindOf(branch);
  const rest = branch.slice(kind.length + 1);
  return slugify(kind === "feature" ? rest : `${kind}-${rest}`);
}

export function mainCheckout(root) {
  return dirname(resolve(root, git(root, "rev-parse", "--git-common-dir")));
}

export const worktreesDir = (main) => join(main, ".claude", "worktrees");

export function isPrimary(root) {
  return resolve(root, git(root, "rev-parse", "--git-dir")) === resolve(root, git(root, "rev-parse", "--git-common-dir"));
}

export function parseWorktrees(porcelain) {
  return porcelain.split(/\r?\n\r?\n/).filter((block) => block.trim()).map((block) => {
    const fields = Object.fromEntries(block.split(/\r?\n/).map((line) => {
      const [key, ...rest] = line.split(" ");
      return [key, rest.join(" ") || true];
    }));
    return {
      path: resolve(fields.worktree),
      head: fields.HEAD,
      branch: typeof fields.branch === "string" ? fields.branch.replace(/^refs\/heads\//, "") : null,
      locked: Boolean(fields.locked),
    };
  });
}

export const listWorktrees = (root) => parseWorktrees(git(root, "worktree", "list", "--porcelain"));

/**
 * Why: only work that has visibly landed is removed. A session that has just
 * started has a clean worktree too, but no merged pull request yet.
 */
export function sweepVerdict(w) {
  if (w.isMain) return { remove: false, reason: "main checkout" };
  if (!w.managed) return { remove: false, reason: "not under .claude/worktrees" };
  if (w.isCurrent) return { remove: false, reason: "this session is in it" };
  if (w.locked) return { remove: false, reason: "locked" };
  if (w.scratch) return scratchVerdict(w);
  if (!w.pr) return { remove: false, reason: "no merged pull request" };
  if (w.dirty) return { remove: false, reason: "uncommitted changes" };
  if (!w.contained) return { remove: false, reason: "commits not on the target branch" };
  return { remove: true, reason: `PR #${w.pr} landed` };
}

export const IDLE_HOURS = 24;

/** A subagent, EnterWorktree or detached worktree has no task branch, so no pull request to wait for. */
export const isScratch = (branch) => !branch || !TASK_BRANCH.test(branch);

/**
 * Why the idle time: a subagent's fresh worktree is clean and holds nothing
 * beyond develop yet, exactly like an abandoned one. A release worktree holds
 * no work of its own.
 */
function scratchVerdict(w) {
  if (w.dirty) return { remove: false, reason: "uncommitted changes" };
  if (!w.contained) return { remove: false, reason: "commits not on develop or main" };
  if (!w.release && w.idleHours < IDLE_HOURS) return { remove: false, reason: `used in the last ${IDLE_HOURS} hours` };
  return { remove: true, reason: "no work of its own" };
}

/** A local branch with no worktree whose every commit is on develop or main holds nothing to lose. */
export function branchVerdict(b) {
  if (["develop", "main"].includes(b.name)) return { remove: false, reason: "long-lived branch" };
  if (b.checkedOut) return { remove: false, reason: "checked out in a worktree" };
  if (!b.contained) return { remove: false, reason: "commits not on develop or main" };
  return { remove: true, reason: "every commit is on develop or main" };
}

/**
 * Why the rename: Windows cannot delete a folder an open shell or editor sits
 * in, and git would empty it before failing. A rename fails up front instead.
 */
function assertNotInUse(path) {
  const probe = `${path}.removing`;
  try { renameSync(path, probe); } catch { throw new Error(`${path} is open in a shell or editor`); }
  renameSync(probe, path);
}

/** Never forced: git refuses a dirty worktree, and that refusal means keep it. */
export function removeWorktree(main, path, branch) {
  stopServers(path);
  assertNotInUse(path);
  removeDocs(main, path);
  git(main, "worktree", "remove", path);
  // Why -D: git compares with the local develop, which may be behind; the caller has already checked origin holds every commit.
  if (branch) git(main, "branch", "-D", branch);
}
