import { existsSync, lstatSync, renameSync, unlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { git } from "../delivery/process.mjs";

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
  if (!w.pr) return { remove: false, reason: "no merged pull request" };
  if (w.dirty) return { remove: false, reason: "uncommitted changes" };
  if (!w.contained) return { remove: false, reason: "commits not on the target branch" };
  if (w.landed === "failed") return { remove: false, reason: "develop CI is red after the merge" };
  if (w.landed !== "passed") return { remove: false, reason: "develop CI still running" };
  return { remove: true, reason: `PR #${w.pr} landed` };
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
  assertNotInUse(path);
  const docs = join(path, "docs");
  if (existsSync(docs) && lstatSync(docs).isSymbolicLink()) unlinkSync(docs);
  git(main, "worktree", "remove", path);
  // Why -D: git compares with the local develop, which may be behind; the caller has already checked origin holds every commit.
  if (branch) git(main, "branch", "-D", branch);
}
