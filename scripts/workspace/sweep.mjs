import { existsSync, statSync } from "node:fs";
import { basename, isAbsolute, join, relative, resolve } from "node:path";
import { git } from "../delivery/process.mjs";
import { pullRequest } from "../delivery/github.mjs";
import { isAncestor } from "../delivery/sync.mjs";
import { branchVerdict, isScratch, listWorktrees, removeWorktree, sweepVerdict, worktreesDir } from "./worktrees.mjs";

const inside = (dir, path) => {
  const rel = relative(dir, path);
  return Boolean(rel) && !rel.startsWith("..") && !isAbsolute(rel);
};

const onDevelopOrMain = (root, ref) => isAncestor(root, ref, "origin/develop") || isAncestor(root, ref, "origin/main");

/** Hours since git last touched the worktree's index, HEAD or reflog. */
export function idleHours(path, now = Date.now()) {
  const gitDir = resolve(path, git(path, "rev-parse", "--git-dir"));
  const times = ["index", "HEAD", "logs/HEAD"].map((name) => join(gitDir, name)).filter(existsSync).map((file) => statSync(file).mtimeMs);
  return times.length ? (now - Math.max(...times)) / 3_600_000 : Infinity;
}

function facts(main, current, worktree) {
  const base = {
    isMain: resolve(main) === worktree.path,
    managed: inside(worktreesDir(main), worktree.path),
    isCurrent: Boolean(current) && resolve(current) === worktree.path,
    locked: worktree.locked,
  };
  if (base.isMain || !base.managed || base.isCurrent || base.locked) return base;
  const dirty = Boolean(git(worktree.path, "--no-optional-locks", "status", "--porcelain"));
  if (isScratch(worktree.branch)) {
    return { ...base, scratch: true, release: !worktree.branch && basename(worktree.path).startsWith("release-"), dirty, contained: onDevelopOrMain(worktree.path, "HEAD"), idleHours: idleHours(worktree.path) };
  }
  const pr = dirty ? null : pullRequest(main, worktree.branch, "merged");
  if (!pr) return { ...base, dirty };
  const target = pr.baseRefName;
  return {
    ...base, dirty, pr: pr.number, target,
    contained: isAncestor(worktree.path, "HEAD", `origin/${target}`),
  };
}

function sweepBranches(main) {
  const checkedOut = new Set(listWorktrees(main).map((w) => w.branch).filter(Boolean));
  const names = git(main, "for-each-ref", "--format=%(refname:short)", "refs/heads").split(/\r?\n/).filter(Boolean);
  const report = { removed: [], kept: [] };
  for (const name of names) {
    const verdict = branchVerdict({ name, checkedOut: checkedOut.has(name), contained: !checkedOut.has(name) && onDevelopOrMain(main, `refs/heads/${name}`) });
    if (verdict.remove) {
      git(main, "branch", "-D", name);
      report.removed.push(name);
    } else if (verdict.reason === "commits not on develop or main") report.kept.push(name);
  }
  return report;
}

/** Removes every managed worktree whose work has landed or that never held any, then branches with nothing to lose. Reports the rest. */
export function sweep(main, current) {
  git(main, "fetch", "--quiet", "origin", "develop", "main");
  const report = [];
  for (const worktree of listWorktrees(main)) {
    const known = facts(main, current, worktree);
    if (known.isMain || !known.managed) continue;
    const verdict = sweepVerdict(known);
    if (verdict.remove) {
      try { removeWorktree(main, worktree.path, worktree.branch); }
      catch (error) { report.push({ path: worktree.path, kept: error.message }); continue; }
      report.push({ path: worktree.path, removed: verdict.reason });
    } else report.push({ path: worktree.path, kept: verdict.reason });
  }
  git(main, "worktree", "prune");
  const branches = sweepBranches(main);
  if (branches.removed.length) report.push({ branches: branches.removed, removed: "every commit is on develop or main" });
  if (branches.kept.length) report.push({ branches: branches.kept, kept: "commits not on develop or main" });
  return report;
}
